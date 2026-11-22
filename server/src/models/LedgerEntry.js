import mongoose from 'mongoose';

/**
 * The points passbook: one row per change. Balance = SUM(points).
 * Positive = points added, negative = points removed.
 */
const ledgerSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['EARN', 'REDEEM', 'REFUND', 'REVERSE'], required: true },
    points: { type: Number, required: true }, // signed
    refId: { type: String }, // the order this row belongs to
    note: { type: String, maxlength: 255 },
    // e.g. "EARN:<orderId>" - the same event can be recorded only once (stops double awards)
    idempotencyKey: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ledgerSchema.index({ user: 1, _id: -1 });
ledgerSchema.index(
  { idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string' } } }
);

export const LedgerEntry = mongoose.model('LedgerEntry', ledgerSchema);
