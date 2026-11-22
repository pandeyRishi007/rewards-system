import { Router } from 'express';
import { z } from 'zod';
import { Order } from '../models/Order.js';
import { getSettings } from '../models/Settings.js';
import { debit, getBalance, reverseOrder, withTx, HttpError, sessionOpt } from '../services/rewards.js';
import { allowedRedeemPoints, pointsToPaise } from '../services/rules.js';
import { priceCart } from '../services/cart.js';
import { ah, requireAuth } from '../middleware/auth.js';

const router = Router();

const orderSchema = z.object({
  items: z.array(z.object({ productId: z.string(), qty: z.number().int().min(1).max(99) })).min(1),
  pointsToRedeem: z.number().int().min(0).default(0),
});

router.post('/', requireAuth, ah(async (req, res) => {
  const { items, pointsToRedeem } = orderSchema.parse(req.body);
  const settings = await getSettings();
  const { lines, subtotalPaise } = await priceCart(items);

  const order = await withTx(async (session) => {
    let discountPaise = 0;
    if (pointsToRedeem > 0) {
      const balance = await getBalance(req.user._id, session);
      const allowed = allowedRedeemPoints({ cartPaise: subtotalPaise, balance, requested: pointsToRedeem }, settings);
      if (pointsToRedeem < settings.minRedeem) throw new HttpError(422, `Minimum redemption is ${settings.minRedeem} points`);
      if (pointsToRedeem > allowed) throw new HttpError(422, `At most ${allowed} points can be used on this cart`);
      discountPaise = pointsToPaise(pointsToRedeem, settings);
    }
    const [o] = await Order.create(
      [{ user: req.user._id, items: lines, subtotalPaise, pointsRedeemed: pointsToRedeem, discountPaise, totalPaise: subtotalPaise - discountPaise }],
      sessionOpt(session)
    );
    if (pointsToRedeem > 0) {
      await debit(
        { user: req.user._id, type: 'REDEEM', points: pointsToRedeem, refId: String(o._id), note: `Redeemed on order #${String(o._id).slice(-6)}`, key: `REDEEM:${o._id}` },
        session
      );
    }
    return o;
  });
  res.status(201).json(order);
}));

router.get('/mine', requireAuth, ah(async (req, res) => {
  res.json(await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).lean());
}));

/** Customers may cancel their own order while it's still "placed". Admins can also refund delivered orders. */
router.patch('/:id/cancel', requireAuth, ah(async (req, res) => {
  const isAdmin = req.user.role === 'admin';
  const order = await withTx(async (session) => {
    const o = await Order.findById(req.params.id).session(session || null);
    if (!o || (!isAdmin && String(o.user) !== String(req.user._id))) throw new HttpError(404, 'Order not found');
    if (o.status === 'placed') o.status = 'cancelled';
    else if (o.status === 'delivered' && isAdmin) o.status = 'refunded';
    else throw new HttpError(409, `A ${o.status} order cannot be cancelled`);
    await reverseOrder(o, session);
    await o.save(sessionOpt(session));
    return o;
  });
  res.json(order);
}));

export default router;
