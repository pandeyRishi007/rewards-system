import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: String,
    pricePaise: Number, // price snapshot at purchase time
    qty: { type: Number, min: 1 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: [itemSchema],
    subtotalPaise: Number,
    pointsRedeemed: { type: Number, default: 0 },
    discountPaise: { type: Number, default: 0 },
    totalPaise: Number,
    pointsEarned: { type: Number, default: 0 },
    status: { type: String, enum: ['placed', 'delivered', 'cancelled', 'refunded'], default: 'placed' },
  },
  { timestamps: true }
);

export const Order = mongoose.model('Order', orderSchema);
