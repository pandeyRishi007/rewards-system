import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { HttpError } from '../services/rewards.js';

export const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export const signToken = (user) => jwt.sign({ sub: String(user._id) }, env.jwtSecret, { expiresIn: '7d' });

export const requireAuth = ah(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new HttpError(401, 'Login required');
  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    throw new HttpError(401, 'Session expired, please log in again');
  }
  const user = await User.findById(payload.sub);
  if (!user) throw new HttpError(401, 'Account not found');
  req.user = user;
  next();
});

export const requireAdmin = (req, _res, next) =>
  req.user?.role === 'admin' ? next() : next(new HttpError(403, 'Admins only'));
