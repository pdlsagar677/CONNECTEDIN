import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import mongoose, {Types} from 'mongoose';
import User, { IUser } from '../models/user-model';
import Post, { IPost } from '../models/post-model';
import Comment from '../models/comment-model';
import Message from '../models/message-model';
import Conversation from '../models/conversation-model';
import Notification from '../models/notification-model';
import Story from '../models/story-model';
import { v2 as cloudinary } from 'cloudinary';
import getDataUri from '../utils/datauri';
import { generateAccessToken, generateRefreshToken, generateOTP } from '../utils/generateTokens';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/sendEmail';

declare module 'express' {
  interface Request {
    id?: string;
    file?: MulterFileCompatible;
  }
}

interface MulterFileCompatible {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

interface RegisterRequestBody {
  username: string;
  email: string;
  password: string;
}

interface LoginRequestBody {
  email: string;
  password: string;
}

interface UserResponse {
  _id: string;
  username: string;
  email: string;
  profilePicture: string;
  bio: string;
  followers: string[];
  following: string[];
  posts: Partial<IPost>[];
}

interface LeanUserDocumentPopulated {
  _id: mongoose.Types.ObjectId;
  username: string;
  email: string;
  profilePicture?: string;
  bio?: string;
  gender?: 'male' | 'female';
  followers: mongoose.Types.ObjectId[];
  following: mongoose.Types.ObjectId[];
  posts: IPost[];
  bookmarks: IPost[];
  createdAt: Date;
  updatedAt: Date;
}

interface PopulatedProfileResponse {
  _id: string;
  username: string;
  email: string;
  profilePicture: string;
  bio: string;
  gender?: 'male' | 'female';
  followers: string[];
  following: string[];
  posts: IPost[];
  bookmarks: IPost[];
  createdAt: Date;
  updatedAt: Date;
}

interface EditProfileRequestBody {
  bio?: string;
  gender?: 'male' | 'female';
}



export const register = async (req: Request<{}, {}, RegisterRequestBody>, res: Response): Promise<void> => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      res.status(400).json({ message: "All fields are required", success: false });
      return;
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      // If unverified, allow re-registration with new OTP
      if (!existingUser.isVerified) {
        const { otp, hashedOTP, expiry } = await generateOTP();
        existingUser.username = username;
        existingUser.password = await bcrypt.hash(password, 10);
        existingUser.verificationOTP = hashedOTP;
        existingUser.verificationOTPExpiry = expiry;
        await existingUser.save();

        await sendVerificationEmail(email, username, otp);

        res.status(200).json({
          message: "Verification code sent to your email",
          success: true,
          requiresVerification: true,
          email,
        });
        return;
      }
      res.status(409).json({ message: "Email already in use", success: false });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const { otp, hashedOTP, expiry } = await generateOTP();

    await User.create({
      username,
      email,
      password: hashedPassword,
      isVerified: false,
      verificationOTP: hashedOTP,
      verificationOTPExpiry: expiry,
    });

    await sendVerificationEmail(email, username, otp);

    res.status(201).json({
      message: "Verification code sent to your email",
      success: true,
      requiresVerification: true,
      email,
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Registration error:', errorMessage);
    res.status(500).json({ message: "Registration failed", success: false });
  }
}

export const login = async (req: Request<{}, {}, LoginRequestBody>, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required", success: false });
      return;
    }

    const user = await User.findOne({ email }).select('+refreshToken');
    if (!user) {
      res.status(401).json({ message: "Incorrect email or password", success: false });
      return;
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      res.status(401).json({ message: "Incorrect email or password", success: false });
      return;
    }

    // Check email verification
    if (!user.isVerified) {
      res.status(403).json({
        message: "Please verify your email first",
        success: false,
        requiresVerification: true,
        email: user.email,
      });
      return;
    }

    const userId = (user._id as mongoose.Types.ObjectId).toString();

    // Generate access + refresh tokens
    const accessToken = generateAccessToken(userId);
    const refreshToken = generateRefreshToken(userId);

    // Save refresh token in DB only
    user.refreshToken = refreshToken;
    await user.save();

    const populatedPosts = await Promise.all(
      user.posts.map(async (postId) => {
        return await Post.findById(postId);
      })
    );

    const userResponse: UserResponse = {
      _id: userId,
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture || '',
      bio: user.bio || '',
      followers: user.followers.map(id => id.toString()),
      following: user.following.map(id => id.toString()),
      posts: populatedPosts.filter(post => post !== null) as Partial<IPost>[]
    };

    res
      .cookie("token", "", { maxAge: 0, httpOnly: true, sameSite: "lax", secure: true }) // clear old cookie
      .cookie("accessToken", accessToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days (cookie persists; JWT inside expires in 15min)
      })
      .status(200)
      .json({
        message: `Welcome back ${user.username}`,
        success: true,
        user: userResponse,
        accessToken,
      });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Login error:', errorMessage);
    res.status(500).json({ message: "Login failed", success: false });
  }
}

export const logout = async (req: Request, res: Response): Promise<Response> => {
  try {
    // Clear refresh token from DB
    if (req.id) {
      await User.findByIdAndUpdate(req.id, { refreshToken: null });
    }

    return res
      .cookie("accessToken", "", {
        maxAge: 0,
        httpOnly: true,
        sameSite: "lax",
        secure: true,
      })
      .status(200)
      .json({ message: 'Logged out successfully', success: true });
  } catch (error: unknown) {
    console.error('Logout error:', error instanceof Error ? error.message : error);
    return res.status(500).json({ message: 'Logout failed', success: false });
  }
};



// ─── Verify OTP ───
export const verifyOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      res.status(400).json({ message: 'Email and OTP are required', success: false });
      return;
    }

    const user = await User.findOne({ email }).select('+verificationOTP +verificationOTPExpiry +refreshToken');
    if (!user) {
      res.status(404).json({ message: 'User not found', success: false });
      return;
    }

    if (user.isVerified) {
      res.status(400).json({ message: 'Email already verified', success: false });
      return;
    }

    if (!user.verificationOTP || !user.verificationOTPExpiry) {
      res.status(400).json({ message: 'No pending verification. Please register again.', success: false });
      return;
    }

    if (user.verificationOTPExpiry < new Date()) {
      res.status(400).json({ message: 'OTP has expired. Please request a new one.', success: false });
      return;
    }

    const isMatch = await bcrypt.compare(otp, user.verificationOTP);
    if (!isMatch) {
      res.status(400).json({ message: 'Invalid OTP', success: false });
      return;
    }

    // Mark verified and clear OTP fields
    user.isVerified = true;
    user.verificationOTP = null;
    user.verificationOTPExpiry = null;

    // Auto-login: generate tokens
    const userId = (user._id as mongoose.Types.ObjectId).toString();
    const accessToken = generateAccessToken(userId);
    const refreshToken = generateRefreshToken(userId);
    user.refreshToken = refreshToken;
    await user.save();

    const populatedPosts = await Promise.all(
      user.posts.map(async (postId) => Post.findById(postId))
    );

    const userResponse: UserResponse = {
      _id: userId,
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture || '',
      bio: user.bio || '',
      followers: user.followers.map(id => id.toString()),
      following: user.following.map(id => id.toString()),
      posts: populatedPosts.filter(post => post !== null) as Partial<IPost>[]
    };

    res
      .cookie("token", "", { maxAge: 0, httpOnly: true, sameSite: "lax", secure: true }) // clear old cookie
      .cookie("accessToken", accessToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days (cookie persists; JWT inside expires in 15min)
      })
      .status(200)
      .json({
        message: 'Email verified successfully',
        success: true,
        user: userResponse,
        accessToken,
      });

  } catch (error: unknown) {
    console.error('Verify OTP error:', error instanceof Error ? error.message : error);
    res.status(500).json({ message: 'Verification failed', success: false });
  }
};

// ─── Resend OTP ───
export const resendOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ message: 'Email is required', success: false });
      return;
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({ message: 'User not found', success: false });
      return;
    }

    if (user.isVerified) {
      res.status(400).json({ message: 'Email already verified', success: false });
      return;
    }

    const { otp, hashedOTP, expiry } = await generateOTP();
    user.verificationOTP = hashedOTP;
    user.verificationOTPExpiry = expiry;
    await user.save();

    await sendVerificationEmail(email, user.username, otp);

    res.status(200).json({
      message: 'New verification code sent to your email',
      success: true,
    });

  } catch (error: unknown) {
    console.error('Resend OTP error:', error instanceof Error ? error.message : error);
    res.status(500).json({ message: 'Failed to resend OTP', success: false });
  }
};

// ─── Refresh Access Token ───
export const refreshAccessToken = async (req: Request, res: Response): Promise<void> => {
  try {
    // Read expired token from Authorization header first, then cookie fallback
    const authHeader = req.headers.authorization;
    const expiredToken = (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null)
      || req.cookies.accessToken
      || req.cookies.token;

    if (!expiredToken) {
      res.status(401).json({ message: 'No token found', success: false });
      return;
    }

    // Decode without verifying expiry to get userId
    let decoded: any;
    try {
      decoded = jwt.verify(expiredToken, process.env.JWT_ACCESS_SECRET!);
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        decoded = jwt.decode(expiredToken);
      } else {
        res.status(401).json({ message: 'Invalid token', success: false });
        return;
      }
    }

    if (!decoded?.userId) {
      res.status(401).json({ message: 'Invalid token payload', success: false });
      return;
    }

    // Find user and validate refresh token from DB
    const user = await User.findById(decoded.userId).select('+refreshToken');
    if (!user || !user.refreshToken) {
      res.status(401).json({ message: 'Session expired. Please log in again.', success: false });
      return;
    }

    // Verify the DB refresh token is still valid
    try {
      jwt.verify(user.refreshToken, process.env.JWT_REFRESH_SECRET!);
    } catch {
      // Refresh token expired — force re-login
      user.refreshToken = null;
      await user.save();
      res
        .cookie("accessToken", "", { maxAge: 0, httpOnly: true, sameSite: "lax", secure: true })
        .status(401)
        .json({ message: 'Session expired. Please log in again.', success: false });
      return;
    }

    // Token rotation: generate new both tokens
    const userId = (user._id as mongoose.Types.ObjectId).toString();
    const newAccessToken = generateAccessToken(userId);
    const newRefreshToken = generateRefreshToken(userId);

    user.refreshToken = newRefreshToken;
    await user.save();

    res
      .cookie("accessToken", newAccessToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days (cookie persists; JWT inside expires in 15min)
      })
      .status(200)
      .json({ success: true, message: 'Token refreshed', accessToken: newAccessToken });

  } catch (error: unknown) {
    console.error('Refresh token error:', error instanceof Error ? error.message : error);
    res.status(500).json({ message: 'Token refresh failed', success: false });
  }
};

interface EditProfileRequestBody {
  bio?: string;
}

interface MulterFileCompatible {
  originalname: string;
  buffer: Buffer;
  mimetype: string;
}

export const editProfile = async (
  req: Request<{}, {}, EditProfileRequestBody>,
  res: Response
): Promise<Response> => {
  try {
    const userId: string | undefined = req.id; // Assume req.id is set by auth middleware
    const { bio, gender } = req.body;
    const profilePicture: MulterFileCompatible | undefined = req.file;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized: User ID not found in request.', success: false });
    }

    let cloudResponse;

    if (profilePicture) {
      // Convert any file to data URI (works for jpg, png, gif, etc.)
      const fileUri = getDataUri(profilePicture);

      // Upload to Cloudinary
      cloudResponse = await cloudinary.uploader.upload(fileUri, {
        folder: 'profile_pictures', // Optional: organize uploads
        resource_type: 'auto',       // Important: auto detects file type (image, gif, video)
      });
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found.', success: false });
    }

    // Update fields only if they are provided
    if (bio !== undefined) user.bio = bio;
    if (gender !== undefined) user.gender = gender;
    if (cloudResponse?.secure_url) user.profilePicture = cloudResponse.secure_url;

    await user.save();

    const userResponse: Partial<IUser> = user.toObject();
    delete userResponse.password;

    return res.status(200).json({
      message: 'Profile updated successfully.',
      success: true,
      user: userResponse
    });

  } catch (error: unknown) {
    console.error('Error editing profile:', error);
    return res.status(500).json({
      message: 'Failed to update profile.',
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred.'
    });
  }
};




export const getProfile = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId: string = req.params.id;

    const user = await User.findById(userId)
      .populate({
        path: 'posts',
        options: { sort: { createdAt: -1 } }
      })
      .populate('bookmarks')
      .lean() as unknown as LeanUserDocumentPopulated;

    if (!user) {
      return res.status(404).json({ message: 'User not found', success: false });
    }

    const userResponse: PopulatedProfileResponse = {
      _id: user._id.toString(),
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture || '',
      bio: user.bio || '',
      gender: user.gender,
      followers: user.followers.map((id: mongoose.Types.ObjectId) => id.toString()),
      following: user.following.map((id: mongoose.Types.ObjectId) => id.toString()),
      posts: user.posts,
      bookmarks: user.bookmarks,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return res.status(200).json({
      user: userResponse,
      success: true
    });

  } catch (error: unknown) {
    console.error('Failed to fetch profile:', error instanceof Error ? error.message : error);
    return res.status(500).json({
      message: 'Failed to fetch profile',
      success: false,
    });
  }
};

export const getSuggestedUsers = async (req: Request, res: Response): Promise<Response> => {
    try {
        const currentUser = await User.findById(req.id);
        if (!currentUser) {
            return res.status(401).json({
                message: 'User not found',
                success: false,
            });
        }

        const usersToExclude = [currentUser._id, ...currentUser.following];
        const suggestedUsers = await User.find({
            _id: { $nin: usersToExclude }
        }).select("username profilePicture bio followers").limit(20).lean();

        return res.status(200).json({
            success: true,
            users: suggestedUsers || []
        });
    } catch (error: unknown) {
        console.error(error);
        
        // Handle the error appropriately
        if (error instanceof Error) {
            return res.status(500).json({
                message: 'Server error',
                error: error.message
            });
        }
        
        return res.status(500).json({
            message: 'Unknown server error'
        });
    }
};



export const getChatUsers = async (req: Request, res: Response): Promise<Response> => {
    try {
        const users = await User.find({ _id: { $ne: req.id } }).select("username profilePicture bio").limit(50).lean();
        return res.status(200).json({
            success: true,
            users: users || []
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', success: false });
    }
};

export const searchUsers = async (req: Request, res: Response): Promise<Response> => {
  try {
    const query = req.query.q as string;
    if (!query || query.trim().length < 1) {
      return res.status(400).json({ message: 'Query required', success: false });
    }
    const users = await User.find({
      username: { $regex: query, $options: 'i' }
    }).select('username profilePicture bio').limit(20);
    return res.status(200).json({ users, success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error', success: false });
  }
};

export const getFollowers = async (req: Request, res: Response): Promise<Response> => {
  try {
    const user = await User.findById(req.params.id)
      .populate('followers', 'username profilePicture bio');
    if (!user) {
      return res.status(404).json({ message: 'User not found', success: false });
    }
    return res.status(200).json({ users: user.followers, success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error', success: false });
  }
};

export const getFollowing = async (req: Request, res: Response): Promise<Response> => {
  try {
    const user = await User.findById(req.params.id)
      .populate('following', 'username profilePicture bio');
    if (!user) {
      return res.status(404).json({ message: 'User not found', success: false });
    }
    return res.status(200).json({ users: user.following, success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error', success: false });
  }
};

export const followOrUnfollow = async (req: Request, res: Response): Promise<Response> => {
    try {
        // Validate and convert IDs
        const whoFollows: string | undefined = req.id;
        const whomFollowing: string | undefined = req.params.id;
        
        if (!whoFollows || !whomFollowing) {
            return res.status(400).json({
                message: 'Missing user ID',
                success: false
            });
        }

        // Check if trying to follow self
        if (whoFollows === whomFollowing) {
            return res.status(400).json({
                message: 'You cannot follow/unfollow yourself',
                success: false
            });
        }

        // Convert string IDs to ObjectId
        const whoFollowsId = new Types.ObjectId(whoFollows);
        const whomFollowingId = new Types.ObjectId(whomFollowing);

        const user: IUser | null = await User.findById(whoFollowsId);
        const targetUser: IUser | null = await User.findById(whomFollowingId);

        if (!user || !targetUser) {
            return res.status(404).json({
                message: 'User not found',
                success: false
            });
        }

        // Check if already following
        const isFollowing: boolean = user.following.some(id => id.equals(whomFollowingId));
        
        if (isFollowing) {
            // Unfollow logic
            await Promise.all([
                User.updateOne({ _id: whoFollowsId }, { $pull: { following: whomFollowingId } }),
                User.updateOne({ _id: whomFollowingId }, { $pull: { followers: whoFollowsId } }),
            ]);
            return res.status(200).json({ 
                message: 'Unfollowed successfully', 
                success: true 
            });
        } else {
            // Follow logic
            await Promise.all([
                User.updateOne({ _id: whoFollowsId }, { $push: { following: whomFollowingId } }),
                User.updateOne({ _id: whomFollowingId }, { $push: { followers: whoFollowsId } }),
            ]);

            // Create follow notification
            const followerUser = await User.findById(whoFollowsId).select('username');
            await Notification.create({
                recipient: whomFollowing,
                sender: whoFollows,
                type: 'follow',
                message: `${followerUser?.username} started following you`
            });

            return res.status(200).json({
                message: 'Followed successfully',
                success: true
            });
        }
    } catch (error: unknown) {
        console.error('Error in followOrUnfollow:', error);
        
        if (error instanceof Error) {
            return res.status(500).json({
                message: 'Server error',
                error: error.message,
                success: false
            });
        }
        
        return res.status(500).json({
            message: 'Unknown server error',
            success: false
        });
    }
};

// ─── Change Password (authenticated) ───
export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ message: 'Current password and new password are required', success: false });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ message: 'New password must be at least 6 characters', success: false });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found', success: false });
      return;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      res.status(401).json({ message: 'Current password is incorrect', success: false });
      return;
    }

    user.password = await bcrypt.hash(newPassword, 10);
    // Invalidate refresh token so other sessions are logged out
    user.refreshToken = null;
    await user.save();

    res.status(200).json({ message: 'Password changed successfully', success: true });
  } catch (error: unknown) {
    console.error('Change password error:', error instanceof Error ? error.message : error);
    res.status(500).json({ message: 'Failed to change password', success: false });
  }
};

// ─── Forgot Password (send OTP to email) ───
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ message: 'Email is required', success: false });
      return;
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists
      res.status(200).json({ message: 'If this email is registered, you will receive a reset code', success: true });
      return;
    }

    const { otp, hashedOTP, expiry } = await generateOTP();
    user.verificationOTP = hashedOTP;
    user.verificationOTPExpiry = expiry;
    await user.save();

    await sendPasswordResetEmail(email, user.username, otp);

    res.status(200).json({ message: 'Password reset code sent to your email', success: true });
  } catch (error: unknown) {
    console.error('Forgot password error:', error instanceof Error ? error.message : error);
    res.status(500).json({ message: 'Failed to send reset code', success: false });
  }
};

// ─── Reset Password (verify OTP + set new password) ───
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      res.status(400).json({ message: 'Email, OTP, and new password are required', success: false });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ message: 'Password must be at least 6 characters', success: false });
      return;
    }

    const user = await User.findOne({ email }).select('+verificationOTP +verificationOTPExpiry');
    if (!user) {
      res.status(404).json({ message: 'User not found', success: false });
      return;
    }

    if (!user.verificationOTP || !user.verificationOTPExpiry) {
      res.status(400).json({ message: 'No reset request found. Please request a new code.', success: false });
      return;
    }

    if (user.verificationOTPExpiry < new Date()) {
      res.status(400).json({ message: 'Reset code has expired. Please request a new one.', success: false });
      return;
    }

    const isMatch = await bcrypt.compare(otp, user.verificationOTP);
    if (!isMatch) {
      res.status(400).json({ message: 'Invalid reset code', success: false });
      return;
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.verificationOTP = null;
    user.verificationOTPExpiry = null;
    user.refreshToken = null; // Invalidate all sessions
    await user.save();

    res.status(200).json({ message: 'Password reset successfully. Please log in.', success: true });
  } catch (error: unknown) {
    console.error('Reset password error:', error instanceof Error ? error.message : error);
    res.status(500).json({ message: 'Failed to reset password', success: false });
  }
};

// ─── Delete Account Permanently (cascade delete everything) ───
export const deleteAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.id;
    const { password } = req.body;

    if (!password) {
      res.status(400).json({ message: 'Password is required to delete account', success: false });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found', success: false });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ message: 'Incorrect password', success: false });
      return;
    }

    const userObjectId = user._id as mongoose.Types.ObjectId;

    // 1. Delete all posts by this user + their images from Cloudinary
    const userPosts = await Post.find({ author: userObjectId });
    for (const post of userPosts) {
      if (post.image) {
        try {
          const publicId = post.image.split('/').pop()?.split('.')[0];
          if (publicId) await cloudinary.uploader.destroy(publicId);
        } catch {}
      }
      // Delete comments on this post
      await Comment.deleteMany({ post: post._id });
    }
    await Post.deleteMany({ author: userObjectId });

    // 2. Delete all comments made by this user (on other people's posts)
    await Comment.deleteMany({ author: userObjectId });

    // 3. Delete all stories by this user
    const userStories = await Story.find({ author: userObjectId });
    for (const story of userStories) {
      if (story.image) {
        try {
          const publicId = story.image.split('/').pop()?.split('.')[0];
          if (publicId) await cloudinary.uploader.destroy(publicId);
        } catch {}
      }
    }
    await Story.deleteMany({ author: userObjectId });

    // 4. Delete all messages sent/received + conversations
    await Message.deleteMany({ $or: [{ senderId: userObjectId }, { receiverId: userObjectId }] });
    await Conversation.deleteMany({ participants: userObjectId });

    // 5. Delete all notifications (sent and received)
    await Notification.deleteMany({ $or: [{ recipient: userObjectId }, { sender: userObjectId }] });

    // 6. Remove user from other users' followers/following lists
    await User.updateMany(
      { followers: userObjectId },
      { $pull: { followers: userObjectId } }
    );
    await User.updateMany(
      { following: userObjectId },
      { $pull: { following: userObjectId } }
    );

    // 7. Remove user's likes from all posts
    await Post.updateMany(
      { likes: userObjectId },
      { $pull: { likes: userObjectId } }
    );

    // 8. Remove user from story viewers
    await Story.updateMany(
      { viewers: userObjectId },
      { $pull: { viewers: userObjectId } }
    );

    // 9. Remove user's reactions from messages
    await Message.updateMany(
      { 'reactions.userId': userObjectId },
      { $pull: { reactions: { userId: userObjectId } } }
    );

    // 10. Remove user's bookmarks references from other posts (not needed, bookmarks are on user doc)

    // 11. Delete profile picture from Cloudinary
    if (user.profilePicture) {
      try {
        const publicId = user.profilePicture.split('/').pop()?.split('.')[0];
        if (publicId) await cloudinary.uploader.destroy(publicId);
      } catch {}
    }

    // 12. Finally, delete the user
    await User.findByIdAndDelete(userObjectId);

    // Clear cookie
    res
      .cookie("accessToken", "", { maxAge: 0, httpOnly: true, sameSite: "lax", secure: true })
      .cookie("token", "", { maxAge: 0, httpOnly: true, sameSite: "lax", secure: true })
      .status(200)
      .json({ message: 'Account deleted permanently', success: true });

  } catch (error: unknown) {
    console.error('Delete account error:', error instanceof Error ? error.message : error);
    res.status(500).json({ message: 'Failed to delete account', success: false });
  }
};