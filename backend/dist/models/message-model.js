"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const messageSchema = new mongoose_1.default.Schema({
    senderId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Sender ID is required"],
    },
    receiverId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Receiver ID is required"],
    },
    message: {
        type: String,
        default: '',
        trim: true,
    },
    read: {
        type: Boolean,
        default: false,
    },
    messageType: {
        type: String,
        enum: ['text', 'image', 'voice'],
        default: 'text',
    },
    imageUrl: { type: String },
    voiceUrl: { type: String },
    voiceDuration: { type: Number },
    replyTo: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Message",
    },
    reactions: [{
            userId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "User" },
            emoji: { type: String },
        }],
    storyReply: {
        storyId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "Story" },
        storyImage: { type: String },
    },
}, {
    timestamps: true,
});
// Performance indexes
messageSchema.index({ receiverId: 1, read: 1 }); // unread count
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 }); // conversation fetch
const Message = mongoose_1.default.model("Message", messageSchema);
exports.default = Message;
