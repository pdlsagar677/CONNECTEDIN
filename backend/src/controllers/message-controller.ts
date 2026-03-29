import { Request, Response } from "express";
import sharp from "sharp";
import Conversation from "../models/conversation-model";
import { getReceiverSocketId, getIO } from "../socket/socket";
import Message from "../models/message-model";
import User from "../models/user-model";
import cloudinary from "../utils/cloudinary";

interface AuthenticatedRequest extends Request {
  id?: string;
  user?: { _id: string };
  file?: Express.Multer.File;
}

interface SendMessageBody {
  textMessage: string;
  messageType?: 'text' | 'image' | 'voice';
  voiceDuration?: number;
  replyTo?: string;
  storyReply?: {
    storyId: string;
    storyImage: string;
  };
}

export const sendMessage = async (req: Request, res: Response): Promise<Response> => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const senderId = authenticatedReq.id || authenticatedReq.user?._id;
    const receiverId = req.params.id;
    const { textMessage: message, messageType = 'text', voiceDuration, replyTo, storyReply }: SendMessageBody = req.body;

    if (!senderId) {
      return res.status(401).json({ success: false, message: "Unauthorized: sender ID not found" });
    }
    if (!receiverId) {
      return res.status(400).json({ success: false, message: "Receiver ID is required" });
    }

    let imageUrl: string | undefined;
    let voiceUrl: string | undefined;

    // Handle file upload (image or voice)
    if (authenticatedReq.file) {
      if (messageType === 'image') {
        const optimized = await sharp(authenticatedReq.file.buffer)
          .resize({ width: 800, height: 800, fit: 'inside' })
          .toFormat('jpeg', { quality: 80 })
          .toBuffer();
        const fileUri = `data:image/jpeg;base64,${optimized.toString('base64')}`;
        const cloudRes = await cloudinary.uploader.upload(fileUri);
        imageUrl = cloudRes.secure_url;
      } else if (messageType === 'voice') {
        const fileUri = `data:audio/webm;base64,${authenticatedReq.file.buffer.toString('base64')}`;
        const cloudRes = await cloudinary.uploader.upload(fileUri, { resource_type: 'video' });
        voiceUrl = cloudRes.secure_url;
      }
    }

    // For text messages, require message content
    if (messageType === 'text' && (!message || message.trim() === '') && !storyReply) {
      return res.status(400).json({ success: false, message: "Message content is required" });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId]
      });
    }

    const newMessage = await Message.create({
      senderId,
      receiverId,
      message: message || '',
      messageType,
      ...(imageUrl && { imageUrl }),
      ...(voiceUrl && { voiceUrl }),
      ...(voiceDuration && { voiceDuration }),
      ...(replyTo && { replyTo }),
      ...(storyReply && { storyReply }),
    });

    if (newMessage) {
      conversation.messages.push(newMessage._id as any);
      await conversation.save();
    }

    // Populate replyTo if exists
    let populatedMessage = newMessage;
    if (replyTo) {
      populatedMessage = await Message.findById(newMessage._id).populate('replyTo') as any;
    }

    // Notify receiver via socket (include sender info for notification popup)
    try {
      const receiverSocketId = getReceiverSocketId(receiverId);
      if (receiverSocketId) {
        const sender = await User.findById(senderId).select('username profilePicture').lean();
        const msgDoc = populatedMessage || newMessage;
        const messagePayload = typeof msgDoc.toObject === 'function'
          ? msgDoc.toObject()
          : msgDoc;
        getIO().to(receiverSocketId).emit("newMessage", {
          ...messagePayload,
          senderInfo: sender ? { username: sender.username, profilePicture: sender.profilePicture } : undefined,
        });
      }
    } catch (socketErr) {
      console.error("Socket emit error:", socketErr);
    }

    return res.status(201).json({ success: true, newMessage: populatedMessage || newMessage });
  } catch (error) {
    console.error("sendMessage error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getMessage = async (req: Request, res: Response): Promise<Response> => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const senderId = authenticatedReq.id || authenticatedReq.user?._id;
    const receiverId = req.params.id;

    if (!senderId) {
      return res.status(401).json({ success: false, message: "Unauthorized: sender ID not found" });
    }
    if (!receiverId) {
      return res.status(400).json({ success: false, message: "Receiver ID is required" });
    }

    const conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] }
    }).populate({
      path: "messages",
      populate: { path: "replyTo", select: "message senderId messageType" }
    });

    if (!conversation) {
      return res.status(200).json({ success: true, messages: [] });
    }

    return res.status(200).json({ success: true, messages: conversation.messages || [] });
  } catch (error) {
    console.error("getMessage error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const unsendMessage = async (req: Request, res: Response): Promise<Response> => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = authenticatedReq.id;
    const { id } = req.params;

    const message = await Message.findById(id);
    if (!message) return res.status(404).json({ success: false, message: "Message not found" });

    // Only the sender can unsend
    if (message.senderId.toString() !== userId) {
      return res.status(403).json({ success: false, message: "You can only unsend your own messages" });
    }

    // Remove message from conversation
    await Conversation.updateMany(
      { messages: message._id },
      { $pull: { messages: message._id } }
    );

    await Message.findByIdAndDelete(id);

    // Notify the receiver in real-time
    const receiverId = message.receiverId.toString();
    try {
      const receiverSocketId = getReceiverSocketId(receiverId);
      if (receiverSocketId) {
        getIO().to(receiverSocketId).emit("messageUnsent", { messageId: id });
      }
    } catch (err) {
      // silent
    }

    return res.status(200).json({ success: true, message: "Message unsent" });
  } catch (error) {
    console.error("unsendMessage error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const markMessageRead = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    await Message.findByIdAndUpdate(id, { read: true });
    return res.status(200).json({ success: true, message: 'Message marked as read' });
  } catch (error) {
    console.error("markMessageRead error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const markConversationRead = async (req: Request, res: Response): Promise<Response> => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = authenticatedReq.id;
    const senderId = req.params.id; // the other user

    await Message.updateMany(
      { senderId, receiverId: userId, read: false },
      { $set: { read: true } }
    );

    // Notify sender that messages were read
    try {
      const senderSocketId = getReceiverSocketId(senderId);
      if (senderSocketId) {
        getIO().to(senderSocketId).emit("messagesRead", { readBy: userId });
      }
    } catch (err) {
      // silent
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("markConversationRead error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const reactToMessage = async (req: Request, res: Response): Promise<Response> => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = authenticatedReq.id;
    const { id } = req.params;
    const { emoji } = req.body;

    const message = await Message.findById(id);
    if (!message) return res.status(404).json({ success: false, message: "Message not found" });

    // Remove existing reaction from this user
    message.reactions = message.reactions.filter(
      (r: any) => r.userId.toString() !== userId
    );

    // Add new reaction (if emoji provided)
    if (emoji) {
      message.reactions.push({ userId: userId as any, emoji });
    }

    await message.save();

    // Notify the other user
    const otherUserId = message.senderId.toString() === userId
      ? message.receiverId.toString()
      : message.senderId.toString();

    try {
      const otherSocket = getReceiverSocketId(otherUserId);
      if (otherSocket) {
        getIO().to(otherSocket).emit("messageReaction", {
          messageId: id,
          reactions: message.reactions,
        });
      }
    } catch (err) {
      // silent
    }

    return res.status(200).json({ success: true, reactions: message.reactions });
  } catch (error) {
    console.error("reactToMessage error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getUnreadCount = async (req: Request, res: Response): Promise<Response> => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = authenticatedReq.id;

    const counts = await Message.aggregate([
      { $match: { receiverId: { $eq: userId ? require('mongoose').Types.ObjectId.createFromHexString(userId) : null }, read: false } },
      { $group: { _id: "$senderId", count: { $sum: 1 } } }
    ]);

    const totalUnread = counts.reduce((sum: number, c: any) => sum + c.count, 0);
    const perUser: Record<string, number> = {};
    counts.forEach((c: any) => { perUser[c._id.toString()] = c.count; });

    return res.status(200).json({ success: true, totalUnread, perUser });
  } catch (error) {
    console.error("getUnreadCount error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
