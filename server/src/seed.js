import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { env } from './config/env.js';
import { User } from './models/User.js';
import { Product } from './models/Product.js';
import { Order } from './models/Order.js';
import { LedgerEntry } from './models/LedgerEntry.js';

if (env.isProd) throw new Error('Refusing to seed (wipes data) when NODE_ENV=production');
await mongoose.connect(env.mongoUri);
await Promise.all([User.deleteMany({}), Product.deleteMany({}), Order.deleteMany({}), LedgerEntry.deleteMany({})]);

const hash = (p) => bcrypt.hash(p, 10);
await User.create({ name: 'Admin', email: 'admin@demo.com', passwordHash: await hash('Admin@123'), role: 'admin' });
const demo = await User.create({ name: 'Demo Customer', email: 'user@demo.com', passwordHash: await hash('User@123') });

// Give the demo customer some points to redeem straight away.
await LedgerEntry.create({ user: demo._id, type: 'EARN', points: 1000, note: 'Earned on a past order' });

await Product.create([
  { name: 'Wireless Earbuds', pricePaise: 149900, emoji: '🎧', category: 'Electronics', description: 'Bluetooth 5.3, 24h battery' },
  { name: 'Smart Watch', pricePaise: 299900, emoji: '⌚', category: 'Electronics', description: 'Heart-rate, GPS, 7-day battery' },
  { name: 'Running Shoes', pricePaise: 219900, emoji: '👟', category: 'Fashion', description: 'Lightweight daily trainers' },
  { name: 'Cotton T-Shirt', pricePaise: 49900, emoji: '👕', category: 'Fashion', description: '100% cotton, regular fit' },
  { name: 'Backpack', pricePaise: 89900, emoji: '🎒', category: 'Fashion', description: '25L, water resistant' },
  { name: 'Coffee Maker', pricePaise: 179900, emoji: '☕', category: 'Home', description: 'Drip brewer, 1.2L' },
  { name: 'Novel: The Alchemist', pricePaise: 29900, emoji: '📖', category: 'Books', description: 'Paperback' },
  { name: 'Yoga Mat', pricePaise: 59900, emoji: '🧘', category: 'Sports', description: '6mm anti-slip' },
]);

console.log('Seeded. Admin: admin@demo.com / Admin@123   Customer: user@demo.com / User@123');
await mongoose.disconnect();
