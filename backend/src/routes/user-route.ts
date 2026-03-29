import express from 'express';
import {
  register, login, logout, getProfile, getSuggestedUsers, getChatUsers,
  followOrUnfollow, editProfile, searchUsers, getFollowers, getFollowing,
  verifyOTP, resendOTP, refreshAccessToken,
  changePassword, forgotPassword, resetPassword, deleteAccount
} from '../controllers/user-controller';
import isAuthenticated from '../middlewares/isAuthenticated';
import { uploadProfilePicture } from '../middlewares/multer';
import { authLimiter, otpLimiter } from '../middlewares/rateLimiter';

const router = express.Router();

// Public auth routes (with rate limiting)
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', otpLimiter, resendOTP);
router.post('/refresh', refreshAccessToken);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/logout', isAuthenticated, logout);
router.post('/change-password', isAuthenticated, changePassword);
router.delete('/delete-account', isAuthenticated, deleteAccount);
router.get('/:id/profile', isAuthenticated, getProfile);
router.post('/profile/edit', isAuthenticated, uploadProfilePicture, editProfile);
router.get('/search', isAuthenticated, searchUsers);
router.get('/suggested', isAuthenticated, getSuggestedUsers);
router.get('/chat-users', isAuthenticated, getChatUsers);
router.get('/:id/followers', isAuthenticated, getFollowers);
router.get('/:id/following', isAuthenticated, getFollowing);
router.post('/followorunfollow/:id', isAuthenticated, followOrUnfollow);

export default router;
