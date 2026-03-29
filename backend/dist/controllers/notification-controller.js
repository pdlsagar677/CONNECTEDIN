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
exports.markAllAsRead = exports.markAsRead = exports.getUnreadCount = exports.getNotifications = void 0;
const notification_model_1 = __importDefault(require("../models/notification-model"));
const getNotifications = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.id;
        const page = parseInt(req.query.page) || 1;
        const limit = 20;
        const notifications = yield notification_model_1.default.find({ recipient: userId })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('sender', 'username profilePicture')
            .populate('post', 'image');
        return res.status(200).json({ notifications, success: true });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', success: false });
    }
});
exports.getNotifications = getNotifications;
const getUnreadCount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.id;
        const count = yield notification_model_1.default.countDocuments({ recipient: userId, read: false });
        return res.status(200).json({ count, success: true });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', success: false });
    }
});
exports.getUnreadCount = getUnreadCount;
const markAsRead = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield notification_model_1.default.findByIdAndUpdate(id, { read: true });
        return res.status(200).json({ success: true, message: 'Marked as read' });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', success: false });
    }
});
exports.markAsRead = markAsRead;
const markAllAsRead = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.id;
        yield notification_model_1.default.updateMany({ recipient: userId, read: false }, { read: true });
        return res.status(200).json({ success: true, message: 'All notifications marked as read' });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', success: false });
    }
});
exports.markAllAsRead = markAllAsRead;
