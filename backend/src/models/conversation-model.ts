import mongoose, { Document, Model, Schema, Types } from "mongoose";
import { IUser } from "./user-model"; // Assuming you have IUser interface
import { IMessage } from "./message-model"; // Assuming you have IMessage interface

// 1. Define TypeScript interface for Conversation
export interface IConversation extends Document {
  participants: Types.ObjectId[] | IUser[]; // Can be ObjectIds or populated Users
  messages: Types.ObjectId[] | IMessage[]; // Can be ObjectIds or populated Messages
  createdAt?: Date; // Will be added by timestamps
  updatedAt?: Date;
}

// 2. Create the typed schema
const conversationSchema: Schema<IConversation> = new mongoose.Schema(
  {
    participants: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      required: [true, 'At least one participant is required'],
      validate: {
        validator: function (participants: Types.ObjectId[]) {
          return participants.length >= 2;
        },
        message: 'Conversation must have at least 2 participants'
      }
    },
    messages: [{
      type: Schema.Types.ObjectId,
      ref: 'Message',
      default: []
    }]
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);


// 3. Add virtual for last message (optional but useful)
conversationSchema.virtual('lastMessage').get(function(this: IConversation) {
  if (this.messages && this.messages.length > 0) {
    return this.messages[this.messages.length - 1];
  }
  return null;
});

// 4. Add index for better query performance
conversationSchema.index({ participants: 1, updatedAt: -1 });

// 5. Create the typed model
const Conversation: Model<IConversation> = mongoose.model<IConversation>(
  'Conversation', 
  conversationSchema
);

// 6. Export the model
export default Conversation;