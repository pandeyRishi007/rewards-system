import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { User } from '../models/User.js';
import { HttpError } from '../services/rewards.js';
import { ah, signToken, requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 50, standardHeaders: true, legacyHeaders: false }));

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email(),
  password: z.string().min(8).max(100),
});
const loginSchema = z.object({ email: z.string().trim().email(), password: z.string().min(1) });

const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role });

router.post('/register', ah(async (req, res) => {
  const { name, email, password } = registerSchema.parse(req.body);
  const passwordHash = await bcrypt.hash(password, 10); // never store plain passwords
  const user = await User.create({ name, email, passwordHash });
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
}));

router.post('/login', ah(async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);
  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  const ok = user && (await bcrypt.compare(password, user.passwordHash));
  if (!ok) throw new HttpError(401, 'Wrong email or password');
  res.json({ token: signToken(user), user: publicUser(user) });
}));

router.get('/me', requireAuth, (req, res) => res.json({ user: publicUser(req.user) }));

export default router;
