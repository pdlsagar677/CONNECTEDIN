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
exports.bookmarkPost = exports.getExplorePosts = exports.getPostsByHashtag = exports.deletePost = exports.getBookmarkedPosts = exports.editPost = exports.getCommentsOfPost = exports.addComment = exports.dislikePost = exports.likePost = exports.getUserPost = exports.getAllPost = exports.addNewPost = void 0;
const sharp_1 = __importDefault(require("sharp"));
const cloudinary_1 = __importDefault(require("../utils/cloudinary"));
const post_model_1 = __importDefault(require("../models/post-model"));
const user_model_1 = __importDefault(require("../models/user-model"));
const comment_model_1 = __importDefault(require("../models/comment-model"));
const socket_1 = require("../socket/socket");
const notification_model_1 = __importDefault(require("../models/notification-model"));
const addNewPost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { caption } = req.body;
        const image = req.file;
        const authorId = req.id;
        if (!image)
            return res.status(400).json({ message: 'Image required' });
        // image upload 
        const optimizedImageBuffer = yield (0, sharp_1.default)(image.buffer)
            .resize({ width: 800, height: 800, fit: 'inside' })
            .toFormat('jpeg', { quality: 80 })
            .toBuffer();
        // buffer to data uri
        const fileUri = `data:image/jpeg;base64,${optimizedImageBuffer.toString('base64')}`;
        const cloudResponse = yield cloudinary_1.default.uploader.upload(fileUri);
        // Extract hashtags from caption
        const hashtags = caption ? (caption.match(/#(\w+)/g) || []).map((tag) => tag.slice(1).toLowerCase()) : [];
        const post = yield post_model_1.default.create({
            caption,
            image: cloudResponse.secure_url,
            author: authorId,
            hashtags,
        });
        const user = yield user_model_1.default.findById(authorId);
        if (user) {
            user.posts.push(post._id);
            yield user.save();
        }
        yield post.populate({ path: 'author', select: '-password' });
        return res.status(201).json({
            message: 'New post added',
            post,
            success: true,
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Internal server error', success: false });
    }
});
exports.addNewPost = addNewPost;
const getAllPost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const [total, posts] = yield Promise.all([
            post_model_1.default.countDocuments(),
            post_model_1.default.find()
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate({ path: 'author', select: 'username profilePicture' })
                .populate({
                path: 'comments',
                options: { sort: { createdAt: -1 }, limit: 3 },
                populate: {
                    path: 'author',
                    select: 'username profilePicture'
                }
            })
                .lean()
        ]);
        return res.status(200).json({
            posts,
            success: true,
            page,
            hasMore: page * limit < total,
            total,
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Internal server error', success: false });
    }
});
exports.getAllPost = getAllPost;
const getUserPost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authorId = req.id;
        const posts = yield post_model_1.default.find({ author: authorId }).sort({ createdAt: -1 }).populate({
            path: 'author',
            select: 'username profilePicture'
        }).populate({
            path: 'comments',
            options: { sort: { createdAt: -1 } },
            populate: {
                path: 'author',
                select: 'username profilePicture'
            }
        });
        return res.status(200).json({
            posts,
            success: true
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Internal server error', success: false });
    }
});
exports.getUserPost = getUserPost;
const likePost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const likeKrneWalaUserKiId = req.id;
        const postId = req.params.id;
        const post = yield post_model_1.default.findById(postId);
        if (!post)
            return res.status(404).json({ message: 'Post not found', success: false });
        // like logic started
        yield post.updateOne({ $addToSet: { likes: likeKrneWalaUserKiId } });
        yield post.save();
        // implement socket io for real time notification
        const user = yield user_model_1.default.findById(likeKrneWalaUserKiId).select('username profilePicture');
        const postOwnerId = post.author.toString();
        if (postOwnerId !== likeKrneWalaUserKiId) {
            // emit a notification event
            const notification = {
                type: 'like',
                userId: likeKrneWalaUserKiId,
                userDetails: user,
                postId,
                message: 'Your post was liked'
            };
            const postOwnerSocketId = (0, socket_1.getReceiverSocketId)(postOwnerId);
            if (postOwnerSocketId) {
                (0, socket_1.getIO)().to(postOwnerSocketId).emit('notification', notification);
            }
            // Persist notification to DB
            yield notification_model_1.default.create({
                recipient: postOwnerId,
                sender: likeKrneWalaUserKiId,
                type: 'like',
                post: postId,
                message: `${user === null || user === void 0 ? void 0 : user.username} liked your post`
            });
        }
        // Broadcast live like update to all clients
        const updatedPost = yield post_model_1.default.findById(postId);
        (0, socket_1.getIO)().emit('postLikeUpdate', { postId, likes: (updatedPost === null || updatedPost === void 0 ? void 0 : updatedPost.likes) || [] });
        return res.status(200).json({ message: 'Post liked', success: true });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Internal server error', success: false });
    }
});
exports.likePost = likePost;
const dislikePost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const likeKrneWalaUserKiId = req.id;
        const postId = req.params.id;
        const post = yield post_model_1.default.findById(postId);
        if (!post)
            return res.status(404).json({ message: 'Post not found', success: false });
        // dislike logic started
        yield post.updateOne({ $pull: { likes: likeKrneWalaUserKiId } });
        yield post.save();
        // implement socket io for real time notification
        const user = yield user_model_1.default.findById(likeKrneWalaUserKiId).select('username profilePicture');
        const postOwnerId = post.author.toString();
        if (postOwnerId !== likeKrneWalaUserKiId) {
            // emit a notification event
            const notification = {
                type: 'dislike',
                userId: likeKrneWalaUserKiId,
                userDetails: user,
                postId,
                message: 'Your post was disliked'
            };
            const postOwnerSocketId = (0, socket_1.getReceiverSocketId)(postOwnerId);
            if (postOwnerSocketId) {
                (0, socket_1.getIO)().to(postOwnerSocketId).emit('notification', notification);
            }
        }
        // Broadcast live dislike update to all clients
        const updatedPost = yield post_model_1.default.findById(postId);
        (0, socket_1.getIO)().emit('postLikeUpdate', { postId, likes: (updatedPost === null || updatedPost === void 0 ? void 0 : updatedPost.likes) || [] });
        return res.status(200).json({ message: 'Post disliked', success: true });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Internal server error', success: false });
    }
});
exports.dislikePost = dislikePost;
const addComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const postId = req.params.id;
        const commentKrneWalaUserKiId = req.id;
        const { text } = req.body;
        const post = yield post_model_1.default.findById(postId);
        if (!post)
            return res.status(404).json({ message: 'Post not found', success: false });
        if (!text)
            return res.status(400).json({ message: 'text is required', success: false });
        const comment = yield comment_model_1.default.create({
            text,
            author: commentKrneWalaUserKiId,
            post: postId
        });
        yield comment.populate({
            path: 'author',
            select: "username profilePicture"
        });
        post.comments.push(comment._id);
        yield post.save();
        // Create notification for post owner
        const postOwnerId = post.author.toString();
        if (postOwnerId !== commentKrneWalaUserKiId) {
            const commentUser = yield user_model_1.default.findById(commentKrneWalaUserKiId).select('username');
            yield notification_model_1.default.create({
                recipient: postOwnerId,
                sender: commentKrneWalaUserKiId,
                type: 'comment',
                post: postId,
                message: `${commentUser === null || commentUser === void 0 ? void 0 : commentUser.username} commented on your post`
            });
            const postOwnerSocketId = (0, socket_1.getReceiverSocketId)(postOwnerId);
            if (postOwnerSocketId) {
                (0, socket_1.getIO)().to(postOwnerSocketId).emit('notification', {
                    type: 'comment',
                    userId: commentKrneWalaUserKiId,
                    postId,
                    message: `${commentUser === null || commentUser === void 0 ? void 0 : commentUser.username} commented on your post`
                });
            }
        }
        return res.status(201).json({
            message: 'Comment Added',
            comment,
            success: true
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Internal server error', success: false });
    }
});
exports.addComment = addComment;
const getCommentsOfPost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const postId = req.params.id;
        const comments = yield comment_model_1.default.find({ post: postId }).populate('author', 'username profilePicture');
        if (!comments || comments.length === 0) {
            return res.status(404).json({ message: 'No comments found for this post', success: false });
        }
        return res.status(200).json({ success: true, comments });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Internal server error', success: false });
    }
});
exports.getCommentsOfPost = getCommentsOfPost;
const editPost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const postId = req.params.id;
        const authorId = req.id;
        const { caption } = req.body;
        const post = yield post_model_1.default.findById(postId);
        if (!post)
            return res.status(404).json({ message: 'Post not found', success: false });
        if (post.author.toString() !== authorId) {
            return res.status(403).json({ message: 'Unauthorized', success: false });
        }
        const hashtags = caption ? (caption.match(/#(\w+)/g) || []).map((tag) => tag.slice(1).toLowerCase()) : [];
        post.caption = caption || '';
        post.hashtags = hashtags;
        yield post.save();
        yield post.populate({ path: 'author', select: '-password' });
        yield post.populate({
            path: 'comments',
            populate: { path: 'author', select: 'username profilePicture' }
        });
        return res.status(200).json({
            message: 'Post updated',
            post,
            success: true,
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Internal server error', success: false });
    }
});
exports.editPost = editPost;
const getBookmarkedPosts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.id;
        const user = yield user_model_1.default.findById(userId);
        if (!user)
            return res.status(404).json({ message: 'User not found', success: false });
        const posts = yield post_model_1.default.find({ _id: { $in: user.bookmarks } })
            .sort({ createdAt: -1 })
            .populate({ path: 'author', select: 'username profilePicture' })
            .populate({
            path: 'comments',
            populate: { path: 'author', select: 'username profilePicture' }
        });
        return res.status(200).json({ posts, success: true });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Internal server error', success: false });
    }
});
exports.getBookmarkedPosts = getBookmarkedPosts;
const deletePost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const postId = req.params.id;
        const authorId = req.id;
        const post = yield post_model_1.default.findById(postId);
        if (!post)
            return res.status(404).json({ message: 'Post not found', success: false });
        // check if the logged-in user is the owner of the post
        if (post.author.toString() !== authorId) {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        // delete post
        yield post_model_1.default.findByIdAndDelete(postId);
        // remove the post id from the user's post
        const user = yield user_model_1.default.findById(authorId);
        if (user) {
            user.posts = user.posts.filter(id => id.toString() !== postId);
            yield user.save();
        }
        // delete associated comments
        yield comment_model_1.default.deleteMany({ post: postId });
        return res.status(200).json({
            success: true,
            message: 'Post deleted'
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Internal server error', success: false });
    }
});
exports.deletePost = deletePost;
const getPostsByHashtag = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { tag } = req.params;
        const posts = yield post_model_1.default.find({ hashtags: tag.toLowerCase() })
            .sort({ createdAt: -1 })
            .populate({ path: 'author', select: 'username profilePicture' })
            .populate({
            path: 'comments',
            populate: { path: 'author', select: 'username profilePicture' }
        });
        return res.status(200).json({ posts, success: true });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Internal server error', success: false });
    }
});
exports.getPostsByHashtag = getPostsByHashtag;
const getExplorePosts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 20;
        const [posts, total] = yield Promise.all([
            post_model_1.default.find()
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .populate({ path: 'author', select: 'username profilePicture' })
                .select('-comments')
                .lean(),
            post_model_1.default.countDocuments()
        ]);
        return res.status(200).json({
            posts,
            hasMore: page * limit < total,
            success: true
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Internal server error', success: false });
    }
});
exports.getExplorePosts = getExplorePosts;
const bookmarkPost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const postId = req.params.id;
        const authorId = req.id;
        const post = yield post_model_1.default.findById(postId);
        if (!post)
            return res.status(404).json({ message: 'Post not found', success: false });
        const user = yield user_model_1.default.findById(authorId);
        if (!user)
            return res.status(404).json({ message: 'User not found', success: false });
        if (user.bookmarks.includes(post._id)) {
            // already bookmarked -> remove from the bookmark
            yield user.updateOne({ $pull: { bookmarks: post._id } });
            yield user.save();
            return res.status(200).json({ type: 'unsaved', message: 'Post removed from bookmark', success: true });
        }
        else {
            // bookmark krna pdega
            yield user.updateOne({ $addToSet: { bookmarks: post._id } });
            yield user.save();
            return res.status(200).json({ type: 'saved', message: 'Post bookmarked', success: true });
        }
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Internal server error', success: false });
    }
});
exports.bookmarkPost = bookmarkPost;
