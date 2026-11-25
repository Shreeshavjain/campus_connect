/**
 * Request model.
 *
 * A request represents a directed interaction between two students.
 * Multiple requests between the same two users can coexist.
 */

import mongoose, { Document, Schema } from "mongoose";

export type RequestStatus = "pending" | "accepted" | "rejected" | "cancelled" | "completed";
export type RequestType = "FREE" | "SKILL_SWAP";

export interface IRequest extends Document {
  fromUser: mongoose.Types.ObjectId;
  toUser: mongoose.Types.ObjectId;
  type: RequestType;
  status: RequestStatus;
  title: string;
  message?: string;
  skills?: string[];
  offeredSkills?: string[];
  conversationId?: mongoose.Types.ObjectId | null;
  collaborationId?: mongoose.Types.ObjectId | null;
  acceptedAt?: Date | null;
  rejectedAt?: Date | null;
  cancelledAt?: Date | null;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const RequestSchema = new Schema<IRequest>(
  {
    fromUser: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Sender userId is required."],
      index: true,
    },

    toUser: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Receiver userId is required."],
      index: true,
    },

    type: {
      type: String,
      enum: ["FREE", "SKILL_SWAP"],
      required: [true, "Request type is required."],
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "cancelled", "completed"],
      default: "pending",
    },

    title: {
      type: String,
      required: [true, "Title is required."],
      trim: true,
      minlength: [3, "Title must be at least 3 characters."],
      maxlength: [120, "Title must be at most 120 characters."],
    },

    message: {
      type: String,
      trim: true,
      maxlength: [500, "Message must be at most 500 characters."],
      default: null,
    },

    skills: {
      type: [String],
      default: [],
    },

    offeredSkills: {
      type: [String],
      default: [],
    },

    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      default: null,
    },

    collaborationId: {
      type: Schema.Types.ObjectId,
      ref: "Collaboration",
      default: null,
    },

    acceptedAt: {
      type: Date,
      default: null,
    },

    rejectedAt: {
      type: Date,
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent self-requests.
RequestSchema.path("toUser").validate(function (this: IRequest, value: mongoose.Types.ObjectId) {
  return this.fromUser.toString() !== value.toString();
}, "You cannot send a request to yourself.");

// Common queries for dashboard and lists
RequestSchema.index({ toUser: 1, status: 1, createdAt: -1 });
RequestSchema.index({ fromUser: 1, status: 1, createdAt: -1 });

// Sparse indexes for forward-references
RequestSchema.index({ conversationId: 1 }, { sparse: true });
RequestSchema.index({ collaborationId: 1 }, { sparse: true });

const Request =
  (mongoose.models.Request as mongoose.Model<IRequest>) ||
  mongoose.model<IRequest>("Request", RequestSchema);

export default Request;
