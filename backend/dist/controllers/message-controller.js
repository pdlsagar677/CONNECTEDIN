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
exports.getUnreadCount = exports.reactToMessage = exports.markConversationRead = exports.markMessageRead = exports.unsendMessage = exports.getMessage = exports.sendMessage = void 0;
const sharp_1 = __importDefault(require("sharp"));
const conversation_model_1 = __importDefault(require("../models/conversation-model"));
const socket_1 = require("../socket/socket");
const message_model_1 = __importDefault(require("../models/message-model"));
const user_model_1 = __importDefault(require("../models/user-model"));
const cloudinary_1 = __importDefault(require("../utils/cloudinary"));
const sendMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const authenticatedReq = req;
        const senderId = authenticatedReq.id || ((_a = authenticatedReq.user) === null || _a === void 0 ? void 0 : _a._id);
        const receiverId = req.params.id;
        const { textMessage: message, messageType = 'text', voiceDuration, replyTo, storyReply } = req.body;
        if (!senderId) {
            return res.status(401).json({ success: false, message: "Unauthorized: sender ID not found" });
        }
        if (!receiverId) {
            return res.status(400).json({ success: false, message: "Receiver ID is required" });
        }
        let imageUrl;
        let voiceUrl;
        // Handle file upload (image or voice)
        if (authenticatedReq.file) {
            if (messageType === 'image') {
                const optimized = yield (0, sharp_1.default)(authenticatedReq.file.buffer)
                    .resize({ width: 800, height: 800, fit: 'inside' })
                    .toFormat('jpeg', { quality: 80 })
                    .toBuffer();
                const fileUri = `data:image/jpeg;base64,${optimized.toString('base64')}`;
                const cloudRes = yield cloudinary_1.default.uploader.upload(fileUri);
                imageUrl = cloudRes.secure_url;
            }
            else if (messageType === 'voice') {
                const fileUri = `data:audio/webm;base64,${authenticatedReq.file.buffer.toString('base64')}`;
                const cloudRes = yield cloudinary_1.default.uploader.upload(fileUri, { resource_type: 'video' });
                voiceUrl = cloudRes.secure_url;
            }
        }
        // For text messages, require message content
        if (messageType === 'text' && (!message || message.trim() === '') && !storyReply) {
            return res.status(400).json({ success: false, message: "Message content is required" });
        }
        let conversation = yield conversation_model_1.default.findOne({
            participants: { $all: [senderId, receiverId] }
        });
        if (!conversation) {
            conversation = yield conversation_model_1.default.create({
                participants: [senderId, receiverId]
            });
        }
        const newMessage = yield message_model_1.default.create(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({ senderId,
            receiverId, message: message || '', messageType }, (imageUrl && { imageUrl })), (voiceUrl && { voiceUrl })), (voiceDuration && { voiceDuration })), (replyTo && { replyTo })), (storyReply && { storyReply })));
        if (newMessage) {
            conversation.messages.push(newMessage._id);
            yield conversation.save();
        }
        // Populate replyTo if exists
        let populatedMessage = newMessage;
        if (replyTo) {
            populatedMessage = (yield message_model_1.default.findById(newMessage._id).populate('replyTo'));
        }
        // Notify receiver via socket (include sender info for notification popup)
        try {
            const receiverSocketId = (0, socket_1.getReceiverSocketId)(receiverId);
            if (receiverSocketId) {
                const sender = yield user_model_1.default.findById(senderId).select('username profilePicture').lean();
                const msgDoc = populatedMessage || newMessage;
                const messagePayload = typeof msgDoc.toObject === 'function'
                    ? msgDoc.toObject()
                    : msgDoc;
                (0, socket_1.getIO)().to(receiverSocketId).emit("newMessage", Object.assign(Object.assign({}, messagePayload), { senderInfo: sender ? { username: sender.username, profilePicture: sender.profilePicture } : undefined }));
            }
        }
        catch (socketErr) {
            console.error("Socket emit error:", socketErr);
        }
        return res.status(201).json({ success: true, newMessage: populatedMessage || newMessage });
    }
    catch (error) {
        console.error("sendMessage error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
});
exports.sendMessage = sendMessage;
const getMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const authenticatedReq = req;
        const senderId = authenticatedReq.id || ((_a = authenticatedReq.user) === null || _a === void 0 ? void 0 : _a._id);
        const receiverId = req.params.id;
        if (!senderId) {
            return res.status(401).json({ success: false, message: "Unauthorized: sender ID not found" });
        }
        if (!receiverId) {
            return res.status(400).json({ success: false, message: "Receiver ID is required" });
        }
        const conversation = yield conversation_model_1.default.findOne({
            participants: { $all: [senderId, receiverId] }
        }).populate({
            path: "messages",
            populate: { path: "replyTo", select: "message senderId messageType" }
        });
        if (!conversation) {
            return res.status(200).json({ success: true, messages: [] });
        }
        return res.status(200).json({ success: true, messages: conversation.messages || [] });
    }
    catch (error) {
        console.error("getMessage error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
});
exports.getMessage = getMessage;
const unsendMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authenticatedReq = req;
        const userId = authenticatedReq.id;
        const { id } = req.params;
        const message = yield message_model_1.default.findById(id);
        if (!message)
            return res.status(404).json({ success: false, message: "Message not found" });
        // Only the sender can unsend
        if (message.senderId.toString() !== userId) {
            return res.status(403).json({ success: false, message: "You can only unsend your own messages" });
        }
        // Remove message from conversation
        yield conversation_model_1.default.updateMany({ messages: message._id }, { $pull: { messages: message._id } });
        yield message_model_1.default.findByIdAndDelete(id);
        // Notify the receiver in real-time
        const receiverId = message.receiverId.toString();
        try {
            const receiverSocketId = (0, socket_1.getReceiverSocketId)(receiverId);
            if (receiverSocketId) {
                (0, socket_1.getIO)().to(receiverSocketId).emit("messageUnsent", { messageId: id });
            }
        }
        catch (err) {
            // silent
        }
        return res.status(200).json({ success: true, message: "Message unsent" });
    }
    catch (error) {
        console.error("unsendMessage error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
});
exports.unsendMessage = unsendMessage;
const markMessageRead = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield message_model_1.default.findByIdAndUpdate(id, { read: true });
        return res.status(200).json({ success: true, message: 'Message marked as read' });
    }
    catch (error) {
        console.error("markMessageRead error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
});
exports.markMessageRead = markMessageRead;
const markConversationRead = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authenticatedReq = req;
        const userId = authenticatedReq.id;
        const senderId = req.params.id; // the other user
        yield message_model_1.default.updateMany({ senderId, receiverId: userId, read: false }, { $set: { read: true } });
        // Notify sender that messages were read
        try {
            const senderSocketId = (0, socket_1.getReceiverSocketId)(senderId);
            if (senderSocketId) {
                (0, socket_1.getIO)().to(senderSocketId).emit("messagesRead", { readBy: userId });
            }
        }
        catch (err) {
            // silent
        }
        return res.status(200).json({ success: true });
    }
    catch (error) {
        console.error("markConversationRead error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
});
exports.markConversationRead = markConversationRead;
const reactToMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authenticatedReq = req;
        const userId = authenticatedReq.id;
        const { id } = req.params;
        const { emoji } = req.body;
        const message = yield message_model_1.default.findById(id);
        if (!message)
            return res.status(404).json({ success: false, message: "Message not found" });
        // Remove existing reaction from this user
        message.reactions = message.reactions.filter((r) => r.userId.toString() !== userId);
        // Add new reaction (if emoji provided)
        if (emoji) {
            message.reactions.push({ userId: userId, emoji });
        }
        yield message.save();
        // Notify the other user
        const otherUserId = message.senderId.toString() === userId
            ? message.receiverId.toString()
            : message.senderId.toString();
        try {
            const otherSocket = (0, socket_1.getReceiverSocketId)(otherUserId);
            if (otherSocket) {
                (0, socket_1.getIO)().to(otherSocket).emit("messageReaction", {
                    messageId: id,
                    reactions: message.reactions,
                });
            }
        }
        catch (err) {
            // silent
        }
        return res.status(200).json({ success: true, reactions: message.reactions });
    }
    catch (error) {
        console.error("reactToMessage error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
});
exports.reactToMessage = reactToMessage;
const getUnreadCount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authenticatedReq = req;
        const userId = authenticatedReq.id;
        const counts = yield message_model_1.default.aggregate([
            { $match: { receiverId: { $eq: userId ? require('mongoose').Types.ObjectId.createFromHexString(userId) : null }, read: false } },
            { $group: { _id: "$senderId", count: { $sum: 1 } } }
        ]);
        const totalUnread = counts.reduce((sum, c) => sum + c.count, 0);
        const perUser = {};
        counts.forEach((c) => { perUser[c._id.toString()] = c.count; });
        return res.status(200).json({ success: true, totalUnread, perUser });
    }
    catch (error) {
        console.error("getUnreadCount error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
});
exports.getUnreadCount = getUnreadCount;
