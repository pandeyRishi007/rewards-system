import { ZodError } from 'zod';
import { env } from '../config/env.js';

export function notFound(_req, res) {
  res.status(404).json({ error: 'Not found' });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: 'Invalid input', details: err.issues.map((i) => `${i.path.join('.')}: ${i.message}`) });
  }
  if (err?.code === 11000) return res.status(409).json({ error: 'Already exists / duplicate request' });
  if (err?.name === 'CastError') return res.status(400).json({ error: 'Invalid id' });
  if (err?.status) return res.status(err.status).json({ error: err.message });
  console.error(err);
  res.status(500).json({ error: env.isProd ? 'Server error' : err.message });
}
