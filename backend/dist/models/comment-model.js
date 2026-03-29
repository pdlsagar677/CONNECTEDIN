"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const commentSchema = new mongoose_1.default.Schema({
    text: {
        type: String,
        required: [true, 'Comment text is required']
    },
    author: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Author is required']
    },
    post: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Post',
        required: [true, 'Post reference is required']
    }
}, { timestamps: true });
// Performance indexes
commentSchema.index({ post: 1, createdAt: -1 }); // comments on a post
const Comment = mongoose_1.default.model('Comment', commentSchema);
exports.default = Comment;
