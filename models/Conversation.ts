import mongoose, { Document, Schema } from "mongoose";

export interface IConversationParticipant {
  user: mongoose.Types.ObjectId;
  lastReadAt: Date;
  unreadCount: number;
}

export interface IConversation extends Document {
  requestId: mongoose.Types.ObjectId;
  participants: IConversationParticipant[];
  lastMessageAt?: Date | null;
  lastMessagePreview?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationParticipantSchema = new Schema<IConversationParticipant>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lastReadAt: {
      type: Date,
      default: Date.now,
    },
    unreadCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false } // No need for separate _ids for participants array
);

const ConversationSchema = new Schema<IConversation>(
  {
    requestId: {
      type: Schema.Types.ObjectId,
      ref: "Request",
      required: [true, "requestId is required"],
      unique: true, // 1:1 relationship with Request
    },
    participants: {
      type: [ConversationParticipantSchema],
      validate: [
        function (this: IConversation, val: IConversationParticipant[]) {
          return val.length === 2;
        },
        "A conversation must have exactly two participants",
      ],
    },
    lastMessageAt: {
      type: Date,
      default: null,
    },
    lastMessagePreview: {
      type: String,
      maxlength: 100,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
// To fetch user's conversations ordered by latest activity
ConversationSchema.index({ "participants.user": 1, lastMessageAt: -1 });

const Conversation =
  (mongoose.models.Conversation as mongoose.Model<IConversation>) ||
  mongoose.model<IConversation>("Conversation", ConversationSchema);

export default Conversation;
