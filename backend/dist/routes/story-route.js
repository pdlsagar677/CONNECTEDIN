"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const isAuthenticated_1 = __importDefault(require("../middlewares/isAuthenticated"));
const multer_1 = __importDefault(require("../middlewares/multer"));
const story_controller_1 = require("../controllers/story-controller");
const router = express_1.default.Router();
router.post('/', isAuthenticated_1.default, multer_1.default.single('image'), story_controller_1.createStory);
router.get('/feed', isAuthenticated_1.default, story_controller_1.getStoryFeed);
router.get('/:userId', isAuthenticated_1.default, story_controller_1.getUserStories);
router.put('/:id/view', isAuthenticated_1.default, story_controller_1.viewStory);
router.get('/:id/viewers', isAuthenticated_1.default, story_controller_1.getStoryViewers);
router.delete('/:id', isAuthenticated_1.default, story_controller_1.deleteStory);
exports.default = router;
