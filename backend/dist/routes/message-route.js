"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const isAuthenticated_1 = __importDefault(require("../middlewares/isAuthenticated"));
const multer_1 = __importDefault(require("../middlewares/multer"));
const message_controller_1 = require("../controllers/message-controller");
const router = express_1.default.Router();
router.post('/send/:id', isAuthenticated_1.default, multer_1.default.single('file'), message_controller_1.sendMessage);
router.get('/all/:id', isAuthenticated_1.default, message_controller_1.getMessage);
router.delete('/:id/unsend', isAuthenticated_1.default, message_controller_1.unsendMessage);
router.put('/:id/read', isAuthenticated_1.default, message_controller_1.markMessageRead);
router.put('/conversation/:id/read', isAuthenticated_1.default, message_controller_1.markConversationRead);
router.put('/:id/react', isAuthenticated_1.default, message_controller_1.reactToMessage);
router.get('/unread-count', isAuthenticated_1.default, message_controller_1.getUnreadCount);
exports.default = router;
