import { Product } from '../models/Product.js';
import { HttpError } from './rewards.js';

/** Prices a cart from the DATABASE — never trust prices sent by the browser. */
export async function priceCart(items) {
  const qtyById = new Map();
  for (const { productId, qty } of items) qtyById.set(productId, (qtyById.get(productId) || 0) + qty);

  const products = await Product.find({ _id: { $in: [...qtyById.keys()] } }).lean();
  if (products.length !== qtyById.size) throw new HttpError(400, 'One or more products no longer exist');

  const lines = products.map((p) => ({
    product: p._id,
    name: p.name,
    pricePaise: p.pricePaise,
    qty: qtyById.get(String(p._id)),
  }));
  const subtotalPaise = lines.reduce((sum, l) => sum + l.pricePaise * l.qty, 0);
  return { lines, subtotalPaise };
}
