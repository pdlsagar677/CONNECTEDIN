import express from 'express';
import isAuthenticated from '../middlewares/isAuthenticated';
import multerInstance from '../middlewares/multer';
import { createStory, getStoryFeed, getUserStories, viewStory, getStoryViewers, deleteStory } from '../controllers/story-controller';

const router = express.Router();

router.post('/', isAuthenticated, multerInstance.single('image'), createStory as any);
router.get('/feed', isAuthenticated, getStoryFeed);
router.get('/:userId', isAuthenticated, getUserStories);
router.put('/:id/view', isAuthenticated, viewStory);
router.get('/:id/viewers', isAuthenticated, getStoryViewers);
router.delete('/:id', isAuthenticated, deleteStory);

export default router;
