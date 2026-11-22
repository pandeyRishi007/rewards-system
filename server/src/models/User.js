import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    // Bumped inside every points transaction: forces concurrent spends by one user to conflict and retry.
    ledgerSeq: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);
