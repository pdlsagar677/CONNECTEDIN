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
exports.deleteStory = exports.getStoryViewers = exports.viewStory = exports.getUserStories = exports.getStoryFeed = exports.createStory = void 0;
const sharp_1 = __importDefault(require("sharp"));
const cloudinary_1 = __importDefault(require("../utils/cloudinary"));
const story_model_1 = __importDefault(require("../models/story-model"));
const user_model_1 = __importDefault(require("../models/user-model"));
const createStory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authorId = req.id;
        const image = req.file;
        const { caption } = req.body;
        if (!image) {
            return res.status(400).json({ message: 'Image required', success: false });
        }
        const optimizedBuffer = yield (0, sharp_1.default)(image.buffer)
            .resize({ width: 1080, height: 1920, fit: 'inside' })
            .toFormat('jpeg', { quality: 80 })
            .toBuffer();
        const fileUri = `data:image/jpeg;base64,${optimizedBuffer.toString('base64')}`;
        const cloudResponse = yield cloudinary_1.default.uploader.upload(fileUri);
        const story = yield story_model_1.default.create({
            author: authorId,
            image: cloudResponse.secure_url,
            caption: caption || '',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        });
        yield story.populate({ path: 'author', select: 'username profilePicture' });
        return res.status(201).json({
            message: 'Story created',
            story,
            success: true,
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error', success: false });
    }
});
exports.createStory = createStory;
const getStoryFeed = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.id;
        const user = yield user_model_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found', success: false });
        }
        // Get stories from followed users + own stories
        const userIds = [...user.following, user._id];
        const stories = yield story_model_1.default.find({
            author: { $in: userIds },
            expiresAt: { $gt: new Date() },
        })
            .populate('author', 'username profilePicture')
            .sort({ createdAt: -1 });
        // Group by author
        const grouped = {};
        for (const story of stories) {
            const authorId = story.author._id.toString();
            if (!grouped[authorId]) {
                grouped[authorId] = {
                    user: story.author,
                    stories: [],
                    hasUnviewed: false,
                };
            }
            grouped[authorId].stories.push(story);
            if (!story.viewers.some(v => v.toString() === userId)) {
                grouped[authorId].hasUnviewed = true;
            }
        }
        // Put current user's stories first
        const feed = Object.values(grouped).sort((a, b) => {
            if (a.user._id.toString() === userId)
                return -1;
            if (b.user._id.toString() === userId)
                return 1;
            if (a.hasUnviewed && !b.hasUnviewed)
                return -1;
            if (!a.hasUnviewed && b.hasUnviewed)
                return 1;
            return 0;
        });
        return res.status(200).json({ feed, success: true });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error', success: false });
    }
});
exports.getStoryFeed = getStoryFeed;
const getUserStories = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        const stories = yield story_model_1.default.find({
            author: userId,
            expiresAt: { $gt: new Date() },
        })
            .populate('author', 'username profilePicture')
            .sort({ createdAt: 1 });
        return res.status(200).json({ stories, success: true });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error', success: false });
    }
});
exports.getUserStories = getUserStories;
const viewStory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.id;
        const { id } = req.params;
        yield story_model_1.default.findByIdAndUpdate(id, {
            $addToSet: { viewers: userId },
        });
        return res.status(200).json({ success: true, message: 'Story viewed' });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error', success: false });
    }
});
exports.viewStory = viewStory;
const getStoryViewers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.id;
        const { id } = req.params;
        const story = yield story_model_1.default.findById(id).populate('viewers', 'username profilePicture');
        if (!story) {
            return res.status(404).json({ message: 'Story not found', success: false });
        }
        if (story.author.toString() !== userId) {
            return res.status(403).json({ message: 'Only story owner can view this', success: false });
        }
        return res.status(200).json({ viewers: story.viewers, success: true });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error', success: false });
    }
});
exports.getStoryViewers = getStoryViewers;
const deleteStory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.id;
        const { id } = req.params;
        const story = yield story_model_1.default.findById(id);
        if (!story) {
            return res.status(404).json({ message: 'Story not found', success: false });
        }
        if (story.author.toString() !== userId) {
            return res.status(403).json({ message: 'Unauthorized', success: false });
        }
        yield story_model_1.default.findByIdAndDelete(id);
        return res.status(200).json({ success: true, message: 'Story deleted' });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error', success: false });
    }
});
exports.deleteStory = deleteStory;
