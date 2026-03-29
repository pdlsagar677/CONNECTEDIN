import mongoose, { Document, Model, Schema } from "mongoose";

// 1. Define the TypeScript interface for the User document
 export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  profilePicture: string;
  bio: string;
  gender?: 'male' | 'female';
  followers: mongoose.Types.ObjectId[];
  following: mongoose.Types.ObjectId[];
  posts: mongoose.Types.ObjectId[];
  bookmarks: mongoose.Types.ObjectId[];
  refreshToken: string | null;
  isVerified: boolean;
  verificationOTP: string | null;
  verificationOTPExpiry: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// 2. Define the schema
const userSchema: Schema<IUser> = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true 
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  profilePicture: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    default: ''
  },
  gender: {
    type: String,
    enum: ['male', 'female']
  },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  posts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  }],
  bookmarks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  }],
  refreshToken: {
    type: String,
    default: null,
    select: false,
  },
  isVerified: {
    type: Boolean,
    default: true, // existing users treated as verified; register sets false explicitly
  },
  verificationOTP: {
    type: String,
    default: null,
    select: false,
  },
  verificationOTPExpiry: {
    type: Date,
    default: null,
    select: false,
  },
}, { timestamps: true });

// 3. Create the Model
const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);

// 4. Export the Model
export default User;
export type UserDocument = mongoose.HydratedDocument<IUser>;