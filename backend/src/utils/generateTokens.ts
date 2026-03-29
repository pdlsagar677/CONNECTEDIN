import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export const generateAccessToken = (userId: string): string => {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new Error('JWT_ACCESS_SECRET is not configured');
  return jwt.sign({ userId }, secret, { expiresIn: '15m' });
};

export const generateRefreshToken = (userId: string): string => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error('JWT_REFRESH_SECRET is not configured');
  return jwt.sign({ userId }, secret, { expiresIn: '7d' });
};

export const generateOTP = async (): Promise<{
  otp: string;
  hashedOTP: string;
  expiry: Date;
}> => {
  const otp = String(crypto.randomInt(100000, 999999));
  const hashedOTP = await bcrypt.hash(otp, 10);
  const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  return { otp, hashedOTP, expiry };
};
