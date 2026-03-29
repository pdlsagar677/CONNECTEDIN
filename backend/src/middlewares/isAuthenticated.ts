import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface DecodedToken {
  userId: string;
  [key: string]: any;
}

declare module 'express' {
  interface Request {
    id?: string;
  }
}

const isAuthenticated = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  try {
    // Authorization header first (works in all browsers), cookie as fallback
    const authHeader = req.headers.authorization;
    const token = (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null)
      || req.cookies.accessToken
      || req.cookies.token;

    if (!token) {
      return res.status(401).json({
        message: 'User not authenticated',
        success: false,
      });
    }

    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret) {
      console.error('JWT_ACCESS_SECRET is not configured');
      return res.status(500).json({
        message: 'Server configuration error',
        success: false,
      });
    }

    const decode = jwt.verify(token, secret) as DecodedToken;

    if (!decode || !decode.userId) {
      return res.status(401).json({
        message: 'Invalid token',
        success: false,
      });
    }

    req.id = decode.userId;
    next();
  } catch (error: unknown) {
    if (error instanceof jwt.TokenExpiredError) {
      // Signal frontend to refresh the token
      return res.status(401).json({
        message: 'Token expired',
        success: false,
        expired: true,
      });
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        message: 'Invalid token',
        success: false,
      });
    }

    return res.status(500).json({
      message: 'Authentication failed',
      success: false,
    });
  }
};

export default isAuthenticated;