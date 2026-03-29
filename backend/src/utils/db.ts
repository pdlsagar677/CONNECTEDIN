// src/db.ts
import mongoose, { ConnectOptions } from "mongoose";

const connectDB = async (): Promise<boolean> => {
  const MONGO_URI = process.env.MONGO_URI;

  if (!MONGO_URI) {
    console.error("MongoDB connection URI not found");
    return false;
  }

  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    } as ConnectOptions);
    return true;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('MongoDB connection error:', error.message);
    } else {
      console.error('Unknown MongoDB connection error:', error);
    }
    return false;
  }
};

export default connectDB;