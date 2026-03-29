import sharp from "sharp";
import { Request, Response } from "express";
import cloudinary from "../utils/cloudinary";
import Story from "../models/story-model";
import User from "../models/user-model";

interface AuthenticatedRequest extends Request {
  id: string;
  file?: Express.Multer.File;
}

export const createStory = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const authorId = req.id;
    const image = req.file;
    const { caption } = req.body;

    if (!image) {
      return res.status(400).json({ message: 'Image required', success: false });
    }

    const optimizedBuffer = await sharp(image.buffer)
      .resize({ width: 1080, height: 1920, fit: 'inside' })
      .toFormat('jpeg', { quality: 80 })
      .toBuffer();

    const fileUri = `data:image/jpeg;base64,${optimizedBuffer.toString('base64')}`;
    const cloudResponse = await cloudinary.uploader.upload(fileUri);

    const story = await Story.create({
      author: authorId,
      image: cloudResponse.secure_url,
      caption: caption || '',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    await story.populate({ path: 'author', select: 'username profilePicture' });

    return res.status(201).json({
      message: 'Story created',
      story,
      success: true,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error', success: false });
  }
};

export const getStoryFeed = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = (req as AuthenticatedRequest).id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found', success: false });
    }

    // Get stories from followed users + own stories
    const userIds = [...user.following, user._id];

    const stories = await Story.find({
      author: { $in: userIds },
      expiresAt: { $gt: new Date() },
    })
      .populate('author', 'username profilePicture')
      .sort({ createdAt: -1 });

    // Group by author
    const grouped: Record<string, { user: any; stories: any[]; hasUnviewed: boolean }> = {};

    for (const story of stories) {
      const authorId = (story.author as any)._id.toString();
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
      if (a.user._id.toString() === userId) return -1;
      if (b.user._id.toString() === userId) return 1;
      if (a.hasUnviewed && !b.hasUnviewed) return -1;
      if (!a.hasUnviewed && b.hasUnviewed) return 1;
      return 0;
    });

    return res.status(200).json({ feed, success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error', success: false });
  }
};

export const getUserStories = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { userId } = req.params;
    const stories = await Story.find({
      author: userId,
      expiresAt: { $gt: new Date() },
    })
      .populate('author', 'username profilePicture')
      .sort({ createdAt: 1 });

    return res.status(200).json({ stories, success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error', success: false });
  }
};

export const viewStory = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = (req as AuthenticatedRequest).id;
    const { id } = req.params;

    await Story.findByIdAndUpdate(id, {
      $addToSet: { viewers: userId },
    });

    return res.status(200).json({ success: true, message: 'Story viewed' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error', success: false });
  }
};

export const getStoryViewers = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = (req as AuthenticatedRequest).id;
    const { id } = req.params;

    const story = await Story.findById(id).populate('viewers', 'username profilePicture');
    if (!story) {
      return res.status(404).json({ message: 'Story not found', success: false });
    }
    if (story.author.toString() !== userId) {
      return res.status(403).json({ message: 'Only story owner can view this', success: false });
    }

    return res.status(200).json({ viewers: story.viewers, success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error', success: false });
  }
};

export const deleteStory = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = (req as AuthenticatedRequest).id;
    const { id } = req.params;

    const story = await Story.findById(id);
    if (!story) {
      return res.status(404).json({ message: 'Story not found', success: false });
    }
    if (story.author.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized', success: false });
    }

    await Story.findByIdAndDelete(id);
    return res.status(200).json({ success: true, message: 'Story deleted' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error', success: false });
  }
};
