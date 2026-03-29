"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReceiverSocketId = exports.getIO = exports.initSocket = void 0;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const cookie_1 = __importDefault(require("cookie"));
const userSocketMap = {};
const activeCalls = new Map();
const pendingCalls = new Map();
const lastSeenMap = new Map();
let io = null;
const initSocket = (server) => {
    var _a;
    const allowedOrigins = ((_a = process.env.FRONTEND_URL) === null || _a === void 0 ? void 0 : _a.split(',').map(s => s.trim())) || ['http://localhost:5173'];
    io = new socket_io_1.Server(server, {
        cors: {
            origin: allowedOrigins,
            methods: ["GET", "POST"],
            credentials: true,
        },
        maxHttpBufferSize: 10e6, // 10MB for image sharing
    });
    // Authenticate socket connections via auth token, then cookie fallback
    io.use((socket, next) => {
        var _a;
        try {
            // 1. Check auth token passed from frontend (works in all browsers)
            // 2. Fall back to cookie (works when cookies are available)
            const token = ((_a = socket.handshake.auth) === null || _a === void 0 ? void 0 : _a.token)
                || (() => {
                    const rawCookies = socket.handshake.headers.cookie || '';
                    const cookies = cookie_1.default.parse(rawCookies);
                    return cookies.accessToken || cookies.token;
                })();
            if (!token) {
                return next(new Error('Authentication required'));
            }
            const secret = process.env.JWT_ACCESS_SECRET;
            if (!secret) {
                return next(new Error('Server configuration error'));
            }
            const decoded = jsonwebtoken_1.default.verify(token, secret);
            socket.data.userId = decoded.userId;
            next();
        }
        catch (err) {
            if (err.name === 'TokenExpiredError') {
                return next(new Error('Token expired'));
            }
            return next(new Error('Invalid token'));
        }
    });
    io.on("connection", (socket) => {
        const userId = socket.data.userId;
        if (userId) {
            userSocketMap[userId] = socket.id;
            lastSeenMap.delete(userId); // Remove last seen when online
            console.log(`${userId} connected`);
        }
        io === null || io === void 0 ? void 0 : io.emit("getOnlineUsers", Object.keys(userSocketMap));
        // ========== CHAT EVENTS ==========
        // Typing indicators
        socket.on("typing", ({ senderId, receiverId }) => {
            const receiverSocketId = userSocketMap[receiverId];
            if (receiverSocketId) {
                io === null || io === void 0 ? void 0 : io.to(receiverSocketId).emit("typing", { senderId });
            }
        });
        socket.on("stopTyping", ({ senderId, receiverId }) => {
            const receiverSocketId = userSocketMap[receiverId];
            if (receiverSocketId) {
                io === null || io === void 0 ? void 0 : io.to(receiverSocketId).emit("stopTyping", { senderId });
            }
        });
        // Read receipts
        socket.on("messageRead", ({ messageId, readBy, conversationWith }) => {
            const receiverSocketId = userSocketMap[conversationWith];
            if (receiverSocketId) {
                io === null || io === void 0 ? void 0 : io.to(receiverSocketId).emit("messageRead", { messageId, readBy });
            }
        });
        // Last seen request
        socket.on("getLastSeen", ({ targetUserId }) => {
            const lastSeen = lastSeenMap.get(targetUserId);
            socket.emit("lastSeen", { userId: targetUserId, lastSeen: lastSeen || null });
        });
        // ========== WEBRTC CALL EVENTS ==========
        socket.on("call:user", ({ to, from, callerInfo, callType }) => {
            const receiverSocketId = userSocketMap[to];
            if (!receiverSocketId) {
                socket.emit("call:user-offline");
                return;
            }
            if (activeCalls.has(to) || pendingCalls.has(to)) {
                socket.emit("call:busy");
                return;
            }
            // Set 30 second timeout
            const timeoutId = setTimeout(() => {
                pendingCalls.delete(to);
                const callerSocket = userSocketMap[from];
                if (callerSocket)
                    io === null || io === void 0 ? void 0 : io.to(callerSocket).emit("call:missed");
                if (receiverSocketId)
                    io === null || io === void 0 ? void 0 : io.to(receiverSocketId).emit("call:timeout");
            }, 30000);
            pendingCalls.set(to, { callerId: from, callType, timeoutId });
            io === null || io === void 0 ? void 0 : io.to(receiverSocketId).emit("call:incoming", { from, callerInfo, callType });
        });
        socket.on("call:accept", ({ to, from }) => {
            const pending = pendingCalls.get(from);
            if (pending) {
                clearTimeout(pending.timeoutId);
                pendingCalls.delete(from);
            }
            activeCalls.set(from, { peerId: to, callType: (pending === null || pending === void 0 ? void 0 : pending.callType) || 'audio' });
            activeCalls.set(to, { peerId: from, callType: (pending === null || pending === void 0 ? void 0 : pending.callType) || 'audio' });
            const callerSocket = userSocketMap[to];
            if (callerSocket) {
                io === null || io === void 0 ? void 0 : io.to(callerSocket).emit("call:accepted", { from });
            }
        });
        socket.on("call:reject", ({ to }) => {
            const pending = pendingCalls.get(userId);
            if (pending) {
                clearTimeout(pending.timeoutId);
                pendingCalls.delete(userId);
            }
            const callerSocket = userSocketMap[to];
            if (callerSocket) {
                io === null || io === void 0 ? void 0 : io.to(callerSocket).emit("call:rejected");
            }
        });
        socket.on("call:end", ({ to }) => {
            activeCalls.delete(userId);
            activeCalls.delete(to);
            // Also clean pending
            const pending = pendingCalls.get(to);
            if (pending) {
                clearTimeout(pending.timeoutId);
                pendingCalls.delete(to);
            }
            const pendingSelf = pendingCalls.get(userId);
            if (pendingSelf) {
                clearTimeout(pendingSelf.timeoutId);
                pendingCalls.delete(userId);
            }
            const peerSocket = userSocketMap[to];
            if (peerSocket) {
                io === null || io === void 0 ? void 0 : io.to(peerSocket).emit("call:ended");
            }
        });
        // WebRTC signaling relay
        socket.on("webrtc:offer", ({ to, offer }) => {
            const peerSocket = userSocketMap[to];
            if (peerSocket) {
                io === null || io === void 0 ? void 0 : io.to(peerSocket).emit("webrtc:offer", { from: userId, offer });
            }
        });
        socket.on("webrtc:answer", ({ to, answer }) => {
            const peerSocket = userSocketMap[to];
            if (peerSocket) {
                io === null || io === void 0 ? void 0 : io.to(peerSocket).emit("webrtc:answer", { from: userId, answer });
            }
        });
        socket.on("webrtc:ice-candidate", ({ to, candidate }) => {
            const peerSocket = userSocketMap[to];
            if (peerSocket) {
                io === null || io === void 0 ? void 0 : io.to(peerSocket).emit("webrtc:ice-candidate", { from: userId, candidate });
            }
        });
        // ========== DISCONNECT ==========
        socket.on("disconnect", () => {
            if (userId) {
                delete userSocketMap[userId];
                lastSeenMap.set(userId, Date.now());
                console.log(`${userId} disconnected`);
                // Clean up active calls
                const activeCall = activeCalls.get(userId);
                if (activeCall) {
                    activeCalls.delete(userId);
                    activeCalls.delete(activeCall.peerId);
                    const peerSocket = userSocketMap[activeCall.peerId];
                    if (peerSocket) {
                        io === null || io === void 0 ? void 0 : io.to(peerSocket).emit("call:ended");
                    }
                }
                // Clean up pending calls (as receiver)
                const pending = pendingCalls.get(userId);
                if (pending) {
                    clearTimeout(pending.timeoutId);
                    pendingCalls.delete(userId);
                    const callerSocket = userSocketMap[pending.callerId];
                    if (callerSocket) {
                        io === null || io === void 0 ? void 0 : io.to(callerSocket).emit("call:missed");
                    }
                }
                // Clean up pending calls (as caller)
                for (const [receiverId, call] of pendingCalls.entries()) {
                    if (call.callerId === userId) {
                        clearTimeout(call.timeoutId);
                        pendingCalls.delete(receiverId);
                        const receiverSocket = userSocketMap[receiverId];
                        if (receiverSocket) {
                            io === null || io === void 0 ? void 0 : io.to(receiverSocket).emit("call:ended");
                        }
                    }
                }
            }
            io === null || io === void 0 ? void 0 : io.emit("getOnlineUsers", Object.keys(userSocketMap));
        });
    });
    return io;
};
exports.initSocket = initSocket;
const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized. Call initSocket first.");
    }
    return io;
};
exports.getIO = getIO;
const getReceiverSocketId = (receiverId) => userSocketMap[receiverId];
exports.getReceiverSocketId = getReceiverSocketId;
