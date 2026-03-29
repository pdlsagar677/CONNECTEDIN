import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated";
import multerInstance from "../middlewares/multer";
import { getMessage, sendMessage, unsendMessage, markMessageRead, markConversationRead, reactToMessage, getUnreadCount } from "../controllers/message-controller";

const router = express.Router();

router.post('/send/:id', isAuthenticated, multerInstance.single('file'), sendMessage);
router.get('/all/:id', isAuthenticated, getMessage);
router.delete('/:id/unsend', isAuthenticated, unsendMessage);
router.put('/:id/read', isAuthenticated, markMessageRead);
router.put('/conversation/:id/read', isAuthenticated, markConversationRead);
router.put('/:id/react', isAuthenticated, reactToMessage);
router.get('/unread-count', isAuthenticated, getUnreadCount);

export default router;
