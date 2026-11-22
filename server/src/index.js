import mongoose from 'mongoose';
import { env } from './config/env.js';
import { app } from './app.js';

await mongoose.connect(env.mongoUri);
console.log('MongoDB connected');

app.listen(env.port, () => console.log(`API on http://localhost:${env.port}  (transactions: ${env.useTx})`));
