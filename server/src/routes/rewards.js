import { Router } from 'express';
import { z } from 'zod';
import { getSettings } from '../models/Settings.js';
import { getBalance, getHistory } from '../services/rewards.js';
import { allowedRedeemPoints, earnPoints, pointsToPaise } from '../services/rules.js';
import { priceCart } from '../services/cart.js';
import { ah, requireAuth } from '../middleware/auth.js';

const router = Router();

const publicRules = (s) => ({
  earnPer100Rupees: s.earnPer100Rupees,
  redeemValuePaise: s.redeemValuePaise,
  minRedeem: s.minRedeem,
  maxPercent: s.maxPercent,
});

router.get('/settings', ah(async (_req, res) => res.json(publicRules(await getSettings()))));

router.get('/me', requireAuth, ah(async (req, res) => {
  const settings = await getSettings();
  const [balance, history] = await Promise.all([getBalance(req.user._id), getHistory(req.user._id)]);
  res.json({ balance, worthPaise: pointsToPaise(balance, settings), history, rules: publicRules(settings) });
}));

const quoteSchema = z.object({
  items: z.array(z.object({ productId: z.string(), qty: z.number().int().min(1).max(99) })).min(1),
  requested: z.number().int().min(0).optional(), // omit = "use maximum"
});

/** Powers the checkout box: how many points can be used on THIS cart, and what you'd earn. */
router.post('/quote', requireAuth, ah(async (req, res) => {
  const { items, requested } = quoteSchema.parse(req.body);
  const settings = await getSettings();
  const { subtotalPaise } = await priceCart(items);
  const balance = await getBalance(req.user._id);
  const allowed = allowedRedeemPoints({ cartPaise: subtotalPaise, balance, requested: requested ?? Number.MAX_SAFE_INTEGER }, settings);
  const discountPaise = pointsToPaise(allowed, settings);
  res.json({
    subtotalPaise,
    balance,
    allowedPoints: allowed,
    discountPaise,
    totalPaise: subtotalPaise - discountPaise,
    willEarn: earnPoints(subtotalPaise - discountPaise, settings),
    minRedeem: settings.minRedeem,
  });
}));

export default router;
