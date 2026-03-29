import { Server, Socket } from "socket.io";
import jwt from 'jsonwebtoken';
import cookie from 'cookie';

interface UserSocketMap {
  [userId: string]: string;
}

interface ActiveCall {
  peerId: string;
  callType: 'audio' | 'video';
}

interface PendingCall {
  callerId: string;
  callType: 'audio' | 'video';
  timeoutId: NodeJS.Timeout;
}

const userSocketMap: UserSocketMap = {};
const activeCalls: Map<string, ActiveCall> = new Map();
const pendingCalls: Map<string, PendingCall> = new Map();
const lastSeenMap: Map<string, number> = new Map();
let io: Server | null = null;

export const initSocket = (server: any): Server => {
  const allowedOrigins = process.env.FRONTEND_URL?.split(',').map(s => s.trim()) || ['http://localhost:5173'];
  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true,
    },
    maxHttpBufferSize: 10e6, // 10MB for image sharing
  });

  // Authenticate socket connections via auth token, then cookie fallback
  io.use((socket, next) => {
    try {
      // 1. Check auth token passed from frontend (works in all browsers)
      // 2. Fall back to cookie (works when cookies are available)
      const token = (socket.handshake.auth?.token as string)
        || (() => {
          const rawCookies = socket.handshake.headers.cookie || '';
          const cookies = cookie.parse(rawCookies);
          return cookies.accessToken || cookies.token;
        })();

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const secret = process.env.JWT_ACCESS_SECRET;
      if (!secret) {
        return next(new Error('Server configuration error'));
      }

      const decoded = jwt.verify(token, secret) as { userId: string };
      socket.data.userId = decoded.userId;
      next();
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        return next(new Error('Token expired'));
      }
      return next(new Error('Invalid token'));
    }
  });

  io.on("connection", (socket: Socket) => {
    const userId = socket.data.userId as string;

    if (userId) {
      userSocketMap[userId] = socket.id;
      lastSeenMap.delete(userId); // Remove last seen when online
      console.log(`${userId} connected`);
    }

    io?.emit("getOnlineUsers", Object.keys(userSocketMap));

    // ========== CHAT EVENTS ==========

    // Typing indicators
    socket.on("typing", ({ senderId, receiverId }: { senderId: string; receiverId: string }) => {
      const receiverSocketId = userSocketMap[receiverId];
      if (receiverSocketId) {
        io?.to(receiverSocketId).emit("typing", { senderId });
      }
    });

    socket.on("stopTyping", ({ senderId, receiverId }: { senderId: string; receiverId: string }) => {
      const receiverSocketId = userSocketMap[receiverId];
      if (receiverSocketId) {
        io?.to(receiverSocketId).emit("stopTyping", { senderId });
      }
    });

    // Read receipts
    socket.on("messageRead", ({ messageId, readBy, conversationWith }: { messageId: string; readBy: string; conversationWith: string }) => {
      const receiverSocketId = userSocketMap[conversationWith];
      if (receiverSocketId) {
        io?.to(receiverSocketId).emit("messageRead", { messageId, readBy });
      }
    });

    // Last seen request
    socket.on("getLastSeen", ({ targetUserId }: { targetUserId: string }) => {
      const lastSeen = lastSeenMap.get(targetUserId);
      socket.emit("lastSeen", { userId: targetUserId, lastSeen: lastSeen || null });
    });

    // ========== WEBRTC CALL EVENTS ==========

    socket.on("call:user", ({ to, from, callerInfo, callType }: {
      to: string; from: string;
      callerInfo: { _id: string; username: string; profilePicture?: string };
      callType: 'audio' | 'video';
    }) => {
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
        if (callerSocket) io?.to(callerSocket).emit("call:missed");
        if (receiverSocketId) io?.to(receiverSocketId).emit("call:timeout");
      }, 30000);

      pendingCalls.set(to, { callerId: from, callType, timeoutId });

      io?.to(receiverSocketId).emit("call:incoming", { from, callerInfo, callType });
    });

    socket.on("call:accept", ({ to, from }: { to: string; from: string }) => {
      const pending = pendingCalls.get(from);
      if (pending) {
        clearTimeout(pending.timeoutId);
        pendingCalls.delete(from);
      }

      activeCalls.set(from, { peerId: to, callType: pending?.callType || 'audio' });
      activeCalls.set(to, { peerId: from, callType: pending?.callType || 'audio' });

      const callerSocket = userSocketMap[to];
      if (callerSocket) {
        io?.to(callerSocket).emit("call:accepted", { from });
      }
    });

    socket.on("call:reject", ({ to }: { to: string }) => {
      const pending = pendingCalls.get(userId);
      if (pending) {
        clearTimeout(pending.timeoutId);
        pendingCalls.delete(userId);
      }

      const callerSocket = userSocketMap[to];
      if (callerSocket) {
        io?.to(callerSocket).emit("call:rejected");
      }
    });

    socket.on("call:end", ({ to }: { to: string }) => {
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
        io?.to(peerSocket).emit("call:ended");
      }
    });

    // WebRTC signaling relay
    socket.on("webrtc:offer", ({ to, offer }: { to: string; offer: any }) => {
      const peerSocket = userSocketMap[to];
      if (peerSocket) {
        io?.to(peerSocket).emit("webrtc:offer", { from: userId, offer });
      }
    });

    socket.on("webrtc:answer", ({ to, answer }: { to: string; answer: any }) => {
      const peerSocket = userSocketMap[to];
      if (peerSocket) {
        io?.to(peerSocket).emit("webrtc:answer", { from: userId, answer });
      }
    });

    socket.on("webrtc:ice-candidate", ({ to, candidate }: { to: string; candidate: any }) => {
      const peerSocket = userSocketMap[to];
      if (peerSocket) {
        io?.to(peerSocket).emit("webrtc:ice-candidate", { from: userId, candidate });
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
            io?.to(peerSocket).emit("call:ended");
          }
        }

        // Clean up pending calls (as receiver)
        const pending = pendingCalls.get(userId);
        if (pending) {
          clearTimeout(pending.timeoutId);
          pendingCalls.delete(userId);
          const callerSocket = userSocketMap[pending.callerId];
          if (callerSocket) {
            io?.to(callerSocket).emit("call:missed");
          }
        }

        // Clean up pending calls (as caller)
        for (const [receiverId, call] of pendingCalls.entries()) {
          if (call.callerId === userId) {
            clearTimeout(call.timeoutId);
            pendingCalls.delete(receiverId);
            const receiverSocket = userSocketMap[receiverId];
            if (receiverSocket) {
              io?.to(receiverSocket).emit("call:ended");
            }
          }
        }
      }
      io?.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error("Socket.io not initialized. Call initSocket first.");
  }
  return io;
};

export const getReceiverSocketId = (receiverId: string): string | undefined =>
  userSocketMap[receiverId];
