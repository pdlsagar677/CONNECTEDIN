"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_controller_1 = require("../controllers/user-controller");
const isAuthenticated_1 = __importDefault(require("../middlewares/isAuthenticated"));
const multer_1 = require("../middlewares/multer");
const rateLimiter_1 = require("../middlewares/rateLimiter");
const router = express_1.default.Router();
// Public auth routes (with rate limiting)
router.post('/register', rateLimiter_1.authLimiter, user_controller_1.register);
router.post('/login', rateLimiter_1.authLimiter, user_controller_1.login);
router.post('/verify-otp', user_controller_1.verifyOTP);
router.post('/resend-otp', rateLimiter_1.otpLimiter, user_controller_1.resendOTP);
router.post('/refresh', user_controller_1.refreshAccessToken);
router.post('/forgot-password', rateLimiter_1.authLimiter, user_controller_1.forgotPassword);
router.post('/reset-password', user_controller_1.resetPassword);
// Protected routes
router.get('/logout', isAuthenticated_1.default, user_controller_1.logout);
router.post('/change-password', isAuthenticated_1.default, user_controller_1.changePassword);
router.delete('/delete-account', isAuthenticated_1.default, user_controller_1.deleteAccount);
router.get('/:id/profile', isAuthenticated_1.default, user_controller_1.getProfile);
router.post('/profile/edit', isAuthenticated_1.default, multer_1.uploadProfilePicture, user_controller_1.editProfile);
router.get('/search', isAuthenticated_1.default, user_controller_1.searchUsers);
router.get('/suggested', isAuthenticated_1.default, user_controller_1.getSuggestedUsers);
router.get('/chat-users', isAuthenticated_1.default, user_controller_1.getChatUsers);
router.get('/:id/followers', isAuthenticated_1.default, user_controller_1.getFollowers);
router.get('/:id/following', isAuthenticated_1.default, user_controller_1.getFollowing);
router.post('/followorunfollow/:id', isAuthenticated_1.default, user_controller_1.followOrUnfollow);
exports.default = router;
