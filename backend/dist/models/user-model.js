"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
// 2. Define the schema
const userSchema = new mongoose_1.default.Schema({
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
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: 'User'
        }],
    following: [{
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: 'User'
        }],
    posts: [{
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: 'Post'
        }],
    bookmarks: [{
            type: mongoose_1.default.Schema.Types.ObjectId,
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
const User = mongoose_1.default.model('User', userSchema);
// 4. Export the Model
exports.default = User;
