import { Router } from 'express';
import { z } from 'zod';
import { Order } from '../models/Order.js';
import { User } from '../models/User.js';
import { LedgerEntry } from '../models/LedgerEntry.js';
import { Settings, getSettings } from '../models/Settings.js';
import { earnForOrder, withTx, HttpError, sessionOpt } from '../services/rewards.js';
import { ah, requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireAdmin);

router.get('/settings', ah(async (_req, res) => res.json(await getSettings())));

const settingsSchema = z.object({
  earnPer100Rupees: z.number().min(0).max(1000),
  redeemValuePaise: z.number().int().min(1).max(10000),
  minRedeem: z.number().int().min(0),
  maxPercent: z.number().int().min(0).max(100),
});

router.put('/settings', ah(async (req, res) => {
  const data = settingsSchema.parse(req.body);
  await getSettings(); // make sure the document exists
  await Settings.updateOne({ key: 'main' }, { $set: data });
  res.json(await getSettings());
}));

router.get('/users', ah(async (_req, res) => {
  const [users, sums] = await Promise.all([
    User.find().sort({ createdAt: 1 }).lean(),
    LedgerEntry.aggregate([{ $group: { _id: '$user', balance: { $sum: '$points' } } }]),
  ]);
  const byUser = new Map(sums.map((s) => [String(s._id), s.balance]));
  res.json(users.map((u) => ({ id: u._id, name: u.name, email: u.email, role: u.role, balance: byUser.get(String(u._id)) || 0 })));
}));

router.get('/orders', ah(async (_req, res) => {
  res.json(await Order.find().sort({ createdAt: -1 }).limit(100).populate('user', 'name email').lean());
}));

/** Mark an order delivered -> the customer earns points (once only). */
router.patch('/orders/:id/deliver', ah(async (req, res) => {
  const settings = await getSettings();
  const order = await withTx(async (session) => {
    const o = await Order.findById(req.params.id).session(session || null);
    if (!o) throw new HttpError(404, 'Order not found');
    if (o.status !== 'placed') throw new HttpError(409, `A ${o.status} order cannot be delivered`);
    o.pointsEarned = await earnForOrder(o, settings, session);
    o.status = 'delivered';
    await o.save(sessionOpt(session));
    return o;
  });
  res.json(order);
}));

export default router;
