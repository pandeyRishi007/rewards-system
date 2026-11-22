import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    pricePaise: { type: Number, required: true, min: 0, validate: Number.isInteger }, // money is always integer paise
    emoji: { type: String, default: '📦' },
    category: { type: String, default: 'General' },
  },
  { timestamps: true }
);

export const Product = mongoose.model('Product', productSchema);
