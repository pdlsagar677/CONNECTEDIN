import express from 'express';
import isAuthenticated from '../middlewares/isAuthenticated';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '../controllers/notification-controller';

const router = express.Router();

router.get('/', isAuthenticated, getNotifications);
router.get('/unread-count', isAuthenticated, getUnreadCount);
router.put('/:id/read', isAuthenticated, markAsRead);
router.put('/read-all', isAuthenticated, markAllAsRead);

export default router;
