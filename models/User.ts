/**
 * Mongoose User model.
 *
 * Guards against re-compilation during Next.js hot-reloads with the
 * standard `mongoose.models.User || mongoose.model(...)` pattern.
 *
 * Only the hashed password is stored — never the plaintext.
 */

import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  campus?: string;
  branch?: string;
  year?: number;
  skills?: string[];
  interests?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required."],
      trim: true,
      minlength: [2, "Name must be at least 2 characters."],
      maxlength: [100, "Name must be at most 100 characters."],
    },

    email: {
      type: String,
      required: [true, "Email is required."],
      unique: true,
      lowercase: true, // Normalise on save
      trim: true,
    },

    passwordHash: {
      type: String,
      required: [true, "Password hash is required."],
      // Never select passwordHash by default
      select: false,
    },

    campus: {
      type: String,
      trim: true,
      default: null,
    },

    branch: {
      type: String,
      trim: true,
      default: null,
    },

    year: {
      type: Number,
      min: 1,
      max: 8,
      default: null,
    },

    skills: {
      type: [String],
      default: [],
    },

    interests: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true, // Adds createdAt + updatedAt automatically
  }
);

// Compound index — email already has a unique index from `unique: true`,
// but making it explicit improves clarity and ensures MongoDB creates it.
UserSchema.index({ email: 1 });

// Optional profile filter index for student discovery/recommendations.
UserSchema.index({ campus: 1, branch: 1, year: 1 });

/**
 * Exported User model.
 * The singleton guard prevents Mongoose from re-registering the model
 * during hot-reloads in Next.js development mode.
 */
const User = (mongoose.models.User as mongoose.Model<IUser>) || mongoose.model<IUser>("User", UserSchema);

export default User;
