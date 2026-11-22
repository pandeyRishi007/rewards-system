import { Router } from 'express';
import { z } from 'zod';
import { Product } from '../models/Product.js';
import { ah, requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', ah(async (_req, res) => {
  res.json(await Product.find().sort({ createdAt: 1 }).lean());
}));

const productSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().optional(),
  pricePaise: z.number().int().min(0),
  emoji: z.string().optional(),
  category: z.string().optional(),
});

router.post('/', requireAuth, requireAdmin, ah(async (req, res) => {
  res.status(201).json(await Product.create(productSchema.parse(req.body)));
}));

export default router;
