import mongoose from 'mongoose';

export const DEFAULT_SETTINGS = {
  earnPer100Rupees: 10, // points earned per ₹100 of eligible spend  (10 => 1 point per ₹10)
  redeemValuePaise: 50, // value of 1 point in paise                 (50 => 1 point = ₹0.50)
  minRedeem: 100, // smallest redemption, in points
  maxPercent: 50, // max % of the cart payable with points
};

const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'main', unique: true },
    earnPer100Rupees: { type: Number, min: 0 },
    redeemValuePaise: { type: Number, min: 1 },
    minRedeem: { type: Number, min: 0 },
    maxPercent: { type: Number, min: 0, max: 100 },
  },
  { timestamps: true }
);

export const Settings = mongoose.model('Settings', settingsSchema);

export async function getSettings() {
  const doc = await Settings.findOneAndUpdate(
    { key: 'main' },
    { $setOnInsert: { key: 'main', ...DEFAULT_SETTINGS } },
    { upsert: true, returnDocument: 'after', lean: true }
  );
  return { ...DEFAULT_SETTINGS, ...doc };
}
