"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAccount = exports.resetPassword = exports.forgotPassword = exports.changePassword = exports.followOrUnfollow = exports.getFollowing = exports.getFollowers = exports.searchUsers = exports.getChatUsers = exports.getSuggestedUsers = exports.getProfile = exports.editProfile = exports.refreshAccessToken = exports.resendOTP = exports.verifyOTP = exports.logout = exports.login = exports.register = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const mongoose_1 = require("mongoose");
const user_model_1 = __importDefault(require("../models/user-model"));
const post_model_1 = __importDefault(require("../models/post-model"));
const comment_model_1 = __importDefault(require("../models/comment-model"));
const message_model_1 = __importDefault(require("../models/message-model"));
const conversation_model_1 = __importDefault(require("../models/conversation-model"));
const notification_model_1 = __importDefault(require("../models/notification-model"));
const story_model_1 = __importDefault(require("../models/story-model"));
const cloudinary_1 = require("cloudinary");
const datauri_1 = __importDefault(require("../utils/datauri"));
const generateTokens_1 = require("../utils/generateTokens");
const sendEmail_1 = require("../utils/sendEmail");
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            res.status(400).json({ message: "All fields are required", success: false });
            return;
        }
        const existingUser = yield user_model_1.default.findOne({ email });
        if (existingUser) {
            // If unverified, allow re-registration with new OTP
            if (!existingUser.isVerified) {
                const { otp, hashedOTP, expiry } = yield (0, generateTokens_1.generateOTP)();
                existingUser.username = username;
                existingUser.password = yield bcryptjs_1.default.hash(password, 10);
                existingUser.verificationOTP = hashedOTP;
                existingUser.verificationOTPExpiry = expiry;
                yield existingUser.save();
                yield (0, sendEmail_1.sendVerificationEmail)(email, username, otp);
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
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        const { otp, hashedOTP, expiry } = yield (0, generateTokens_1.generateOTP)();
        yield user_model_1.default.create({
            username,
            email,
            password: hashedPassword,
            isVerified: false,
            verificationOTP: hashedOTP,
            verificationOTPExpiry: expiry,
        });
        yield (0, sendEmail_1.sendVerificationEmail)(email, username, otp);
        res.status(201).json({
            message: "Verification code sent to your email",
            success: true,
            requiresVerification: true,
            email,
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Registration error:', errorMessage);
        res.status(500).json({ message: "Registration failed", success: false });
    }
});
exports.register = register;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ message: "Email and password are required", success: false });
            return;
        }
        const user = yield user_model_1.default.findOne({ email }).select('+refreshToken');
        if (!user) {
            res.status(401).json({ message: "Incorrect email or password", success: false });
            return;
        }
        const isPasswordMatch = yield bcryptjs_1.default.compare(password, user.password);
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
        const userId = user._id.toString();
        // Generate access + refresh tokens
        const accessToken = (0, generateTokens_1.generateAccessToken)(userId);
        const refreshToken = (0, generateTokens_1.generateRefreshToken)(userId);
        // Save refresh token in DB only
        user.refreshToken = refreshToken;
        yield user.save();
        const populatedPosts = yield Promise.all(user.posts.map((postId) => __awaiter(void 0, void 0, void 0, function* () {
            return yield post_model_1.default.findById(postId);
        })));
        const userResponse = {
            _id: userId,
            username: user.username,
            email: user.email,
            profilePicture: user.profilePicture || '',
            bio: user.bio || '',
            followers: user.followers.map(id => id.toString()),
            following: user.following.map(id => id.toString()),
            posts: populatedPosts.filter(post => post !== null)
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
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Login error:', errorMessage);
        res.status(500).json({ message: "Login failed", success: false });
    }
});
exports.login = login;
const logout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Clear refresh token from DB
        if (req.id) {
            yield user_model_1.default.findByIdAndUpdate(req.id, { refreshToken: null });
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
    }
    catch (error) {
        console.error('Logout error:', error instanceof Error ? error.message : error);
        return res.status(500).json({ message: 'Logout failed', success: false });
    }
});
exports.logout = logout;
// ─── Verify OTP ───
const verifyOTP = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            res.status(400).json({ message: 'Email and OTP are required', success: false });
            return;
        }
        const user = yield user_model_1.default.findOne({ email }).select('+verificationOTP +verificationOTPExpiry +refreshToken');
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
        const isMatch = yield bcryptjs_1.default.compare(otp, user.verificationOTP);
        if (!isMatch) {
            res.status(400).json({ message: 'Invalid OTP', success: false });
            return;
        }
        // Mark verified and clear OTP fields
        user.isVerified = true;
        user.verificationOTP = null;
        user.verificationOTPExpiry = null;
        // Auto-login: generate tokens
        const userId = user._id.toString();
        const accessToken = (0, generateTokens_1.generateAccessToken)(userId);
        const refreshToken = (0, generateTokens_1.generateRefreshToken)(userId);
        user.refreshToken = refreshToken;
        yield user.save();
        const populatedPosts = yield Promise.all(user.posts.map((postId) => __awaiter(void 0, void 0, void 0, function* () { return post_model_1.default.findById(postId); })));
        const userResponse = {
            _id: userId,
            username: user.username,
            email: user.email,
            profilePicture: user.profilePicture || '',
            bio: user.bio || '',
            followers: user.followers.map(id => id.toString()),
            following: user.following.map(id => id.toString()),
            posts: populatedPosts.filter(post => post !== null)
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
    }
    catch (error) {
        console.error('Verify OTP error:', error instanceof Error ? error.message : error);
        res.status(500).json({ message: 'Verification failed', success: false });
    }
});
exports.verifyOTP = verifyOTP;
// ─── Resend OTP ───
const resendOTP = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400).json({ message: 'Email is required', success: false });
            return;
        }
        const user = yield user_model_1.default.findOne({ email });
        if (!user) {
            res.status(404).json({ message: 'User not found', success: false });
            return;
        }
        if (user.isVerified) {
            res.status(400).json({ message: 'Email already verified', success: false });
            return;
        }
        const { otp, hashedOTP, expiry } = yield (0, generateTokens_1.generateOTP)();
        user.verificationOTP = hashedOTP;
        user.verificationOTPExpiry = expiry;
        yield user.save();
        yield (0, sendEmail_1.sendVerificationEmail)(email, user.username, otp);
        res.status(200).json({
            message: 'New verification code sent to your email',
            success: true,
        });
    }
    catch (error) {
        console.error('Resend OTP error:', error instanceof Error ? error.message : error);
        res.status(500).json({ message: 'Failed to resend OTP', success: false });
    }
});
exports.resendOTP = resendOTP;
// ─── Refresh Access Token ───
const refreshAccessToken = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Read expired token from Authorization header first, then cookie fallback
        const authHeader = req.headers.authorization;
        const expiredToken = ((authHeader === null || authHeader === void 0 ? void 0 : authHeader.startsWith('Bearer ')) ? authHeader.slice(7) : null)
            || req.cookies.accessToken
            || req.cookies.token;
        if (!expiredToken) {
            res.status(401).json({ message: 'No token found', success: false });
            return;
        }
        // Decode without verifying expiry to get userId
        let decoded;
        try {
            decoded = jsonwebtoken_1.default.verify(expiredToken, process.env.JWT_ACCESS_SECRET);
        }
        catch (err) {
            if (err.name === 'TokenExpiredError') {
                decoded = jsonwebtoken_1.default.decode(expiredToken);
            }
            else {
                res.status(401).json({ message: 'Invalid token', success: false });
                return;
            }
        }
        if (!(decoded === null || decoded === void 0 ? void 0 : decoded.userId)) {
            res.status(401).json({ message: 'Invalid token payload', success: false });
            return;
        }
        // Find user and validate refresh token from DB
        const user = yield user_model_1.default.findById(decoded.userId).select('+refreshToken');
        if (!user || !user.refreshToken) {
            res.status(401).json({ message: 'Session expired. Please log in again.', success: false });
            return;
        }
        // Verify the DB refresh token is still valid
        try {
            jsonwebtoken_1.default.verify(user.refreshToken, process.env.JWT_REFRESH_SECRET);
        }
        catch (_a) {
            // Refresh token expired — force re-login
            user.refreshToken = null;
            yield user.save();
            res
                .cookie("accessToken", "", { maxAge: 0, httpOnly: true, sameSite: "lax", secure: true })
                .status(401)
                .json({ message: 'Session expired. Please log in again.', success: false });
            return;
        }
        // Token rotation: generate new both tokens
        const userId = user._id.toString();
        const newAccessToken = (0, generateTokens_1.generateAccessToken)(userId);
        const newRefreshToken = (0, generateTokens_1.generateRefreshToken)(userId);
        user.refreshToken = newRefreshToken;
        yield user.save();
        res
            .cookie("accessToken", newAccessToken, {
            httpOnly: true,
            sameSite: "lax",
            secure: true,
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days (cookie persists; JWT inside expires in 15min)
        })
            .status(200)
            .json({ success: true, message: 'Token refreshed', accessToken: newAccessToken });
    }
    catch (error) {
        console.error('Refresh token error:', error instanceof Error ? error.message : error);
        res.status(500).json({ message: 'Token refresh failed', success: false });
    }
});
exports.refreshAccessToken = refreshAccessToken;
const editProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.id; // Assume req.id is set by auth middleware
        const { bio, gender } = req.body;
        const profilePicture = req.file;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized: User ID not found in request.', success: false });
        }
        let cloudResponse;
        if (profilePicture) {
            // Convert any file to data URI (works for jpg, png, gif, etc.)
            const fileUri = (0, datauri_1.default)(profilePicture);
            // Upload to Cloudinary
            cloudResponse = yield cloudinary_1.v2.uploader.upload(fileUri, {
                folder: 'profile_pictures', // Optional: organize uploads
                resource_type: 'auto', // Important: auto detects file type (image, gif, video)
            });
        }
        const user = yield user_model_1.default.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found.', success: false });
        }
        // Update fields only if they are provided
        if (bio !== undefined)
            user.bio = bio;
        if (gender !== undefined)
            user.gender = gender;
        if (cloudResponse === null || cloudResponse === void 0 ? void 0 : cloudResponse.secure_url)
            user.profilePicture = cloudResponse.secure_url;
        yield user.save();
        const userResponse = user.toObject();
        delete userResponse.password;
        return res.status(200).json({
            message: 'Profile updated successfully.',
            success: true,
            user: userResponse
        });
    }
    catch (error) {
        console.error('Error editing profile:', error);
        return res.status(500).json({
            message: 'Failed to update profile.',
            success: false,
            error: error instanceof Error ? error.message : 'An unknown error occurred.'
        });
    }
});
exports.editProfile = editProfile;
const getProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.params.id;
        const user = yield user_model_1.default.findById(userId)
            .populate({
            path: 'posts',
            options: { sort: { createdAt: -1 } }
        })
            .populate('bookmarks')
            .lean();
        if (!user) {
            return res.status(404).json({ message: 'User not found', success: false });
        }
        const userResponse = {
            _id: user._id.toString(),
            username: user.username,
            email: user.email,
            profilePicture: user.profilePicture || '',
            bio: user.bio || '',
            gender: user.gender,
            followers: user.followers.map((id) => id.toString()),
            following: user.following.map((id) => id.toString()),
            posts: user.posts,
            bookmarks: user.bookmarks,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
        return res.status(200).json({
            user: userResponse,
            success: true
        });
    }
    catch (error) {
        console.error('Failed to fetch profile:', error instanceof Error ? error.message : error);
        return res.status(500).json({
            message: 'Failed to fetch profile',
            success: false,
        });
    }
});
exports.getProfile = getProfile;
const getSuggestedUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const currentUser = yield user_model_1.default.findById(req.id);
        if (!currentUser) {
            return res.status(401).json({
                message: 'User not found',
                success: false,
            });
        }
        const usersToExclude = [currentUser._id, ...currentUser.following];
        const suggestedUsers = yield user_model_1.default.find({
            _id: { $nin: usersToExclude }
        }).select("username profilePicture bio followers").limit(20).lean();
        return res.status(200).json({
            success: true,
            users: suggestedUsers || []
        });
    }
    catch (error) {
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
});
exports.getSuggestedUsers = getSuggestedUsers;
const getChatUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield user_model_1.default.find({ _id: { $ne: req.id } }).select("username profilePicture bio").limit(50).lean();
        return res.status(200).json({
            success: true,
            users: users || []
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', success: false });
    }
});
exports.getChatUsers = getChatUsers;
const searchUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const query = req.query.q;
        if (!query || query.trim().length < 1) {
            return res.status(400).json({ message: 'Query required', success: false });
        }
        const users = yield user_model_1.default.find({
            username: { $regex: query, $options: 'i' }
        }).select('username profilePicture bio').limit(20);
        return res.status(200).json({ users, success: true });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', success: false });
    }
});
exports.searchUsers = searchUsers;
const getFollowers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield user_model_1.default.findById(req.params.id)
            .populate('followers', 'username profilePicture bio');
        if (!user) {
            return res.status(404).json({ message: 'User not found', success: false });
        }
        return res.status(200).json({ users: user.followers, success: true });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', success: false });
    }
});
exports.getFollowers = getFollowers;
const getFollowing = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield user_model_1.default.findById(req.params.id)
            .populate('following', 'username profilePicture bio');
        if (!user) {
            return res.status(404).json({ message: 'User not found', success: false });
        }
        return res.status(200).json({ users: user.following, success: true });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', success: false });
    }
});
exports.getFollowing = getFollowing;
const followOrUnfollow = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Validate and convert IDs
        const whoFollows = req.id;
        const whomFollowing = req.params.id;
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
        const whoFollowsId = new mongoose_1.Types.ObjectId(whoFollows);
        const whomFollowingId = new mongoose_1.Types.ObjectId(whomFollowing);
        const user = yield user_model_1.default.findById(whoFollowsId);
        const targetUser = yield user_model_1.default.findById(whomFollowingId);
        if (!user || !targetUser) {
            return res.status(404).json({
                message: 'User not found',
                success: false
            });
        }
        // Check if already following
        const isFollowing = user.following.some(id => id.equals(whomFollowingId));
        if (isFollowing) {
            // Unfollow logic
            yield Promise.all([
                user_model_1.default.updateOne({ _id: whoFollowsId }, { $pull: { following: whomFollowingId } }),
                user_model_1.default.updateOne({ _id: whomFollowingId }, { $pull: { followers: whoFollowsId } }),
            ]);
            return res.status(200).json({
                message: 'Unfollowed successfully',
                success: true
            });
        }
        else {
            // Follow logic
            yield Promise.all([
                user_model_1.default.updateOne({ _id: whoFollowsId }, { $push: { following: whomFollowingId } }),
                user_model_1.default.updateOne({ _id: whomFollowingId }, { $push: { followers: whoFollowsId } }),
            ]);
            // Create follow notification
            const followerUser = yield user_model_1.default.findById(whoFollowsId).select('username');
            yield notification_model_1.default.create({
                recipient: whomFollowing,
                sender: whoFollows,
                type: 'follow',
                message: `${followerUser === null || followerUser === void 0 ? void 0 : followerUser.username} started following you`
            });
            return res.status(200).json({
                message: 'Followed successfully',
                success: true
            });
        }
    }
    catch (error) {
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
});
exports.followOrUnfollow = followOrUnfollow;
// ─── Change Password (authenticated) ───
const changePassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const user = yield user_model_1.default.findById(userId);
        if (!user) {
            res.status(404).json({ message: 'User not found', success: false });
            return;
        }
        const isMatch = yield bcryptjs_1.default.compare(currentPassword, user.password);
        if (!isMatch) {
            res.status(401).json({ message: 'Current password is incorrect', success: false });
            return;
        }
        user.password = yield bcryptjs_1.default.hash(newPassword, 10);
        // Invalidate refresh token so other sessions are logged out
        user.refreshToken = null;
        yield user.save();
        res.status(200).json({ message: 'Password changed successfully', success: true });
    }
    catch (error) {
        console.error('Change password error:', error instanceof Error ? error.message : error);
        res.status(500).json({ message: 'Failed to change password', success: false });
    }
});
exports.changePassword = changePassword;
// ─── Forgot Password (send OTP to email) ───
const forgotPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400).json({ message: 'Email is required', success: false });
            return;
        }
        const user = yield user_model_1.default.findOne({ email });
        if (!user) {
            // Don't reveal if email exists
            res.status(200).json({ message: 'If this email is registered, you will receive a reset code', success: true });
            return;
        }
        const { otp, hashedOTP, expiry } = yield (0, generateTokens_1.generateOTP)();
        user.verificationOTP = hashedOTP;
        user.verificationOTPExpiry = expiry;
        yield user.save();
        yield (0, sendEmail_1.sendPasswordResetEmail)(email, user.username, otp);
        res.status(200).json({ message: 'Password reset code sent to your email', success: true });
    }
    catch (error) {
        console.error('Forgot password error:', error instanceof Error ? error.message : error);
        res.status(500).json({ message: 'Failed to send reset code', success: false });
    }
});
exports.forgotPassword = forgotPassword;
// ─── Reset Password (verify OTP + set new password) ───
const resetPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const user = yield user_model_1.default.findOne({ email }).select('+verificationOTP +verificationOTPExpiry');
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
        const isMatch = yield bcryptjs_1.default.compare(otp, user.verificationOTP);
        if (!isMatch) {
            res.status(400).json({ message: 'Invalid reset code', success: false });
            return;
        }
        user.password = yield bcryptjs_1.default.hash(newPassword, 10);
        user.verificationOTP = null;
        user.verificationOTPExpiry = null;
        user.refreshToken = null; // Invalidate all sessions
        yield user.save();
        res.status(200).json({ message: 'Password reset successfully. Please log in.', success: true });
    }
    catch (error) {
        console.error('Reset password error:', error instanceof Error ? error.message : error);
        res.status(500).json({ message: 'Failed to reset password', success: false });
    }
});
exports.resetPassword = resetPassword;
// ─── Delete Account Permanently (cascade delete everything) ───
const deleteAccount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const userId = req.id;
        const { password } = req.body;
        if (!password) {
            res.status(400).json({ message: 'Password is required to delete account', success: false });
            return;
        }
        const user = yield user_model_1.default.findById(userId);
        if (!user) {
            res.status(404).json({ message: 'User not found', success: false });
            return;
        }
        const isMatch = yield bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            res.status(401).json({ message: 'Incorrect password', success: false });
            return;
        }
        const userObjectId = user._id;
        // 1. Delete all posts by this user + their images from Cloudinary
        const userPosts = yield post_model_1.default.find({ author: userObjectId });
        for (const post of userPosts) {
            if (post.image) {
                try {
                    const publicId = (_a = post.image.split('/').pop()) === null || _a === void 0 ? void 0 : _a.split('.')[0];
                    if (publicId)
                        yield cloudinary_1.v2.uploader.destroy(publicId);
                }
                catch (_d) { }
            }
            // Delete comments on this post
            yield comment_model_1.default.deleteMany({ post: post._id });
        }
        yield post_model_1.default.deleteMany({ author: userObjectId });
        // 2. Delete all comments made by this user (on other people's posts)
        yield comment_model_1.default.deleteMany({ author: userObjectId });
        // 3. Delete all stories by this user
        const userStories = yield story_model_1.default.find({ author: userObjectId });
        for (const story of userStories) {
            if (story.image) {
                try {
                    const publicId = (_b = story.image.split('/').pop()) === null || _b === void 0 ? void 0 : _b.split('.')[0];
                    if (publicId)
                        yield cloudinary_1.v2.uploader.destroy(publicId);
                }
                catch (_e) { }
            }
        }
        yield story_model_1.default.deleteMany({ author: userObjectId });
        // 4. Delete all messages sent/received + conversations
        yield message_model_1.default.deleteMany({ $or: [{ senderId: userObjectId }, { receiverId: userObjectId }] });
        yield conversation_model_1.default.deleteMany({ participants: userObjectId });
        // 5. Delete all notifications (sent and received)
        yield notification_model_1.default.deleteMany({ $or: [{ recipient: userObjectId }, { sender: userObjectId }] });
        // 6. Remove user from other users' followers/following lists
        yield user_model_1.default.updateMany({ followers: userObjectId }, { $pull: { followers: userObjectId } });
        yield user_model_1.default.updateMany({ following: userObjectId }, { $pull: { following: userObjectId } });
        // 7. Remove user's likes from all posts
        yield post_model_1.default.updateMany({ likes: userObjectId }, { $pull: { likes: userObjectId } });
        // 8. Remove user from story viewers
        yield story_model_1.default.updateMany({ viewers: userObjectId }, { $pull: { viewers: userObjectId } });
        // 9. Remove user's reactions from messages
        yield message_model_1.default.updateMany({ 'reactions.userId': userObjectId }, { $pull: { reactions: { userId: userObjectId } } });
        // 10. Remove user's bookmarks references from other posts (not needed, bookmarks are on user doc)
        // 11. Delete profile picture from Cloudinary
        if (user.profilePicture) {
            try {
                const publicId = (_c = user.profilePicture.split('/').pop()) === null || _c === void 0 ? void 0 : _c.split('.')[0];
                if (publicId)
                    yield cloudinary_1.v2.uploader.destroy(publicId);
            }
            catch (_f) { }
        }
        // 12. Finally, delete the user
        yield user_model_1.default.findByIdAndDelete(userObjectId);
        // Clear cookie
        res
            .cookie("accessToken", "", { maxAge: 0, httpOnly: true, sameSite: "lax", secure: true })
            .cookie("token", "", { maxAge: 0, httpOnly: true, sameSite: "lax", secure: true })
            .status(200)
            .json({ message: 'Account deleted permanently', success: true });
    }
    catch (error) {
        console.error('Delete account error:', error instanceof Error ? error.message : error);
        res.status(500).json({ message: 'Failed to delete account', success: false });
    }
});
exports.deleteAccount = deleteAccount;
