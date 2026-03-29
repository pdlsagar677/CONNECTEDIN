"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
// 2. Define the schema with TypeScript typing
const postSchema = new mongoose_1.default.Schema({
    caption: {
        type: String,
        default: ''
    },
    image: {
        type: String,
        required: [true, 'Image is required']
    },
    author: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Author is required']
    },
    likes: [{
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: 'User'
        }],
    comments: [{
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: 'Comment'
        }],
    hashtags: [{
            type: String,
            index: true
        }]
}, {
    timestamps: true
});
// Performance indexes
postSchema.index({ createdAt: -1 }); // feed sorting
postSchema.index({ author: 1, createdAt: -1 }); // user's posts
// 3. Create the Post model with TypeScript typing
const Post = mongoose_1.default.model('Post', postSchema);
// 4. Export the model
exports.default = Post;
