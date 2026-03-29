import { Request, Response } from 'express';
import Notification from '../models/notification-model';

interface AuthenticatedRequest extends Request {
  id?: string;
}

export const getNotifications = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = (req as AuthenticatedRequest).id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = 20;

    const notifications = await Notification.find({ recipient: userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('sender', 'username profilePicture')
      .populate('post', 'image');

    return res.status(200).json({ notifications, success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error', success: false });
  }
};

export const getUnreadCount = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = (req as AuthenticatedRequest).id;
    const count = await Notification.countDocuments({ recipient: userId, read: false });
    return res.status(200).json({ count, success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error', success: false });
  }
};

export const markAsRead = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    await Notification.findByIdAndUpdate(id, { read: true });
    return res.status(200).json({ success: true, message: 'Marked as read' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error', success: false });
  }
};

export const markAllAsRead = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = (req as AuthenticatedRequest).id;
    await Notification.updateMany({ recipient: userId, read: false }, { read: true });
    return res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error', success: false });
  }
};
