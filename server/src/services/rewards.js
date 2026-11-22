import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { LedgerEntry } from '../models/LedgerEntry.js';
import { User } from '../models/User.js';
import { earnPoints } from './rules.js';

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const sessionOpt = (session) => (session ? { session } : {});

/** Run `fn(session)` as one all-or-nothing transaction. Retries automatically on write conflicts. */
export async function withTx(fn) {
  if (!env.useTx) return fn(null); // dev-only escape hatch for a standalone mongod
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await fn(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
}

/** Balance = sum of every row in the passbook. */
export async function getBalance(userId, session = null) {
  const r = await LedgerEntry.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(String(userId)) } },
    { $group: { _id: null, total: { $sum: '$points' } } },
  ]).session(session);
  return r[0]?.total || 0;
}

export function getHistory(userId, limit = 50) {
  return LedgerEntry.find({ user: userId }).sort({ _id: -1 }).limit(limit).lean();
}

const findByKey = (key, session) => LedgerEntry.findOne({ idempotencyKey: key }).session(session || null);

/** Add points. If this exact event was already recorded, do nothing. */
export async function credit({ user, type, points, refId, note, key }, session = null) {
  if (await findByKey(key, session)) return { duplicate: true };
  await LedgerEntry.create([{ user, type, points, refId, note, idempotencyKey: key }], sessionOpt(session));
  return { duplicate: false };
}

/**
 * Remove points. Must run inside withTx(). Bumping the user's ledgerSeq makes two simultaneous
 * spends conflict: one retries and sees the lower balance, so points can't be spent twice.
 */
export async function debit({ user, type, points, refId, note, key }, session = null) {
  if (await findByKey(key, session)) return { duplicate: true };
  if (points > 0) {
    await User.updateOne({ _id: user }, { $inc: { ledgerSeq: 1 } }, sessionOpt(session));
    const balance = await getBalance(user, session);
    if (balance < points) throw new HttpError(422, `Insufficient points: have ${balance}, need ${points}`);
  }
  await LedgerEntry.create(
    [{ user, type, points: points ? -points : 0, refId, note, idempotencyKey: key }],
    sessionOpt(session)
  );
  return { duplicate: false };
}

/** Order delivered -> earn points on what the customer actually paid for. Returns points earned. */
export async function earnForOrder(order, settings, session = null) {
  const points = earnPoints(order.subtotalPaise - order.discountPaise, settings);
  await credit(
    { user: order.user, type: 'EARN', points, refId: String(order._id), note: `Earned on order #${String(order._id).slice(-6)}`, key: `EARN:${order._id}` },
    session
  );
  return points;
}

/** Order cancelled/refunded -> take back earned points (never below zero), return redeemed points. Safe to repeat. */
export async function reverseOrder(order, session = null) {
  const ref = String(order._id);
  const tag = `#${ref.slice(-6)}`;

  const earn = await findByKey(`EARN:${ref}`, session);
  if (earn && !(await findByKey(`REVERSE:${ref}`, session))) {
    const take = Math.min(earn.points, await getBalance(order.user, session));
    await debit({ user: order.user, type: 'REVERSE', points: take, refId: ref, note: `Reversed for order ${tag}`, key: `REVERSE:${ref}` }, session);
  }

  const redeem = await findByKey(`REDEEM:${ref}`, session);
  if (redeem && !(await findByKey(`REFUND:${ref}`, session))) {
    await credit({ user: order.user, type: 'REFUND', points: -redeem.points, refId: ref, note: `Returned from order ${tag}`, key: `REFUND:${ref}` }, session);
  }
}
