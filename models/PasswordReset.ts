/**
 * Mongoose model for password-reset state (OTP + reset token).
 *
 * Stores a hashed OTP and, after verification, a hashed reset token.
 * Tracks attempt counts and expiry times for both phases.
 *
 * Uses the same hot-reload guard as User.ts.
 *
 * TTL index auto-deletes documents 1 hour after creation — this is
 * purely housekeeping. The application explicitly checks `otpExpiresAt`
 * and `resetTokenExpiresAt` for security-critical expiry enforcement.
 */

import mongoose, { Document, Schema } from "mongoose";

export interface IPasswordReset extends Document {
  userId: mongoose.Types.ObjectId;
  otpHash: string;
  otpExpiresAt: Date;
  otpAttempts: number;
  resetTokenHash: string | null;
  resetTokenExpiresAt: Date | null;
  used: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PasswordResetSchema = new Schema<IPasswordReset>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required."],
    },

    otpHash: {
      type: String,
      required: [true, "OTP hash is required."],
    },

    otpExpiresAt: {
      type: Date,
      required: [true, "OTP expiry is required."],
    },

    otpAttempts: {
      type: Number,
      default: 0,
    },

    resetTokenHash: {
      type: String,
      default: null,
    },

    resetTokenExpiresAt: {
      type: Date,
      default: null,
    },

    used: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // Adds createdAt + updatedAt automatically
  }
);

// Fast lookup: "latest active reset for this user"
PasswordResetSchema.index({ userId: 1, used: 1, otpExpiresAt: -1 });

// Fast lookup by reset token hash (for the reset-password endpoint)
PasswordResetSchema.index({ resetTokenHash: 1 });

// TTL cleanup — removes documents 1 hour after creation.
// This is purely housekeeping; the application checks expiry fields explicitly.
PasswordResetSchema.index({ createdAt: 1 }, { expireAfterSeconds: 3600 });

/**
 * Exported PasswordReset model.
 * The singleton guard prevents Mongoose from re-registering the model
 * during hot-reloads in Next.js development mode.
 */
const PasswordReset =
  (mongoose.models.PasswordReset as mongoose.Model<IPasswordReset>) ||
  mongoose.model<IPasswordReset>("PasswordReset", PasswordResetSchema);

export default PasswordReset;
