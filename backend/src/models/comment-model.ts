import mongoose, { Document, Model, Schema, Types } from "mongoose";
import { IUser } from "./user-model";
import { IPost } from "./post-model";

export interface IComment extends Document {
  text: string;
  author: Types.ObjectId | IUser;
  post: Types.ObjectId | IPost;
  createdAt?: Date;
  updatedAt?: Date;
}

const commentSchema: Schema<IComment> = new mongoose.Schema({
  text: { 
    type: String, 
    required: [true, 'Comment text is required'] 
  },
  author: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: [true, 'Author is required'] 
  },
  post: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Post', 
    required: [true, 'Post reference is required'] 
  }
}, { timestamps: true });

// Performance indexes
commentSchema.index({ post: 1, createdAt: -1 }); // comments on a post

const Comment: Model<IComment> = mongoose.model<IComment>('Comment', commentSchema);

export default Comment;