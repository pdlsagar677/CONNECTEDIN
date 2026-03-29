import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IStory extends Document {
  author: Types.ObjectId;
  image: string;
  caption: string;
  viewers: Types.ObjectId[];
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const storySchema = new Schema<IStory>({
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  image: { type: String, required: true },
  caption: { type: String, default: '' },
  viewers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  expiresAt: { type: Date, required: true, index: true },
}, { timestamps: true });

// TTL index — MongoDB auto-deletes when expiresAt is in the past
storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<IStory>('Story', storySchema);
