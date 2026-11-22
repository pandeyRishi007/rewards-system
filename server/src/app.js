import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import rewardRoutes from './routes/rewards.js';
import orderRoutes from './routes/orders.js';
import adminRoutes from './routes/admin.js';
import { errorHandler, notFound } from './middleware/error.js';

export const app = express();
app.use(helmet());
app.use(cors({ origin: env.clientOrigin }));
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/rewards', rewardRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use(notFound);
app.use(errorHandler);
