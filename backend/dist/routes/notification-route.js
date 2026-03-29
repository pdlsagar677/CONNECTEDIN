"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const isAuthenticated_1 = __importDefault(require("../middlewares/isAuthenticated"));
const notification_controller_1 = require("../controllers/notification-controller");
const router = express_1.default.Router();
router.get('/', isAuthenticated_1.default, notification_controller_1.getNotifications);
router.get('/unread-count', isAuthenticated_1.default, notification_controller_1.getUnreadCount);
router.put('/:id/read', isAuthenticated_1.default, notification_controller_1.markAsRead);
router.put('/read-all', isAuthenticated_1.default, notification_controller_1.markAllAsRead);
exports.default = router;
