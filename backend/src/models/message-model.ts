import mongoose, { Document, Model, Schema, Types } from "mongoose";
import { IUser } from "./user-model";

export interface IMessage extends Document {
  senderId: Types.ObjectId | IUser;
  receiverId: Types.ObjectId | IUser;
  message: string;
  read: boolean;
  messageType: 'text' | 'image' | 'voice';
  imageUrl?: string;
  voiceUrl?: string;
  voiceDuration?: number;
  replyTo?: Types.ObjectId;
  reactions: { userId: Types.ObjectId; emoji: string }[];
  storyReply?: {
    storyId: Types.ObjectId;
    storyImage: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

const messageSchema: Schema<IMessage> = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Sender ID is required"],
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Receiver ID is required"],
    },
    message: {
      type: String,
      default: '',
      trim: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    messageType: {
      type: String,
      enum: ['text', 'image', 'voice'],
      default: 'text',
    },
    imageUrl: { type: String },
    voiceUrl: { type: String },
    voiceDuration: { type: Number },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    reactions: [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      emoji: { type: String },
    }],
    storyReply: {
      storyId: { type: mongoose.Schema.Types.ObjectId, ref: "Story" },
      storyImage: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

// Performance indexes
messageSchema.index({ receiverId: 1, read: 1 }); // unread count
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 }); // conversation fetch

const Message: Model<IMessage> = mongoose.model<IMessage>("Message", messageSchema);

export default Message;
