"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const isAuthenticated_1 = __importDefault(require("../middlewares/isAuthenticated"));
const multer_1 = __importDefault(require("../middlewares/multer")); // Changed from default import
const post_controller_1 = require("../controllers/post-controller");
const router = express_1.default.Router();
// Type the route handlers properly to match AuthenticatedRequest
router.post("/addpost", isAuthenticated_1.default, multer_1.default.single('image'), post_controller_1.addNewPost);
router.get("/all", isAuthenticated_1.default, post_controller_1.getAllPost);
router.get("/explore", isAuthenticated_1.default, post_controller_1.getExplorePosts);
router.get("/hashtag/:tag", isAuthenticated_1.default, post_controller_1.getPostsByHashtag);
router.get("/userpost/all", isAuthenticated_1.default, post_controller_1.getUserPost);
router.get("/:id/like", isAuthenticated_1.default, post_controller_1.likePost);
router.get("/:id/dislike", isAuthenticated_1.default, post_controller_1.dislikePost);
router.post("/:id/comment", isAuthenticated_1.default, post_controller_1.addComment);
router.get("/:id/comment/all", isAuthenticated_1.default, post_controller_1.getCommentsOfPost);
router.put("/edit/:id", isAuthenticated_1.default, post_controller_1.editPost);
router.delete("/delete/:id", isAuthenticated_1.default, post_controller_1.deletePost);
router.get("/bookmarks", isAuthenticated_1.default, post_controller_1.getBookmarkedPosts);
router.get("/:id/bookmark", isAuthenticated_1.default, post_controller_1.bookmarkPost);
exports.default = router;
