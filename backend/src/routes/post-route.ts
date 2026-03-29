import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated";
import  multerInstance  from "../middlewares/multer"; // Changed from default import
import {
  addComment,
  addNewPost,
  bookmarkPost,
  deletePost,
  dislikePost,
  editPost,
  getAllPost,
  getBookmarkedPosts,
  getCommentsOfPost,
  getExplorePosts,
  getPostsByHashtag,
  getUserPost,
  likePost
} from "../controllers/post-controller";

const router = express.Router();

// Type the route handlers properly to match AuthenticatedRequest
router.post("/addpost", isAuthenticated, multerInstance.single('image'), addNewPost as any);
router.get("/all", isAuthenticated, getAllPost);
router.get("/explore", isAuthenticated, getExplorePosts);
router.get("/hashtag/:tag", isAuthenticated, getPostsByHashtag);
router.get("/userpost/all", isAuthenticated, getUserPost as any);
router.get("/:id/like", isAuthenticated, likePost as any);
router.get("/:id/dislike", isAuthenticated, dislikePost as any);
router.post("/:id/comment", isAuthenticated, addComment as any);
router.get("/:id/comment/all", isAuthenticated, getCommentsOfPost);
router.put("/edit/:id", isAuthenticated, editPost as any);
router.delete("/delete/:id", isAuthenticated, deletePost as any);
router.get("/bookmarks", isAuthenticated, getBookmarkedPosts as any);
router.get("/:id/bookmark", isAuthenticated, bookmarkPost as any);

export default router;