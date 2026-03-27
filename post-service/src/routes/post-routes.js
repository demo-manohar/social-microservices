const {
  createPost,
  getPosts,
  getPostById,
  deletePost,
} = require("../controllers/post-controllers");
const express = require("express");
const router = express.Router();
const {authenticateRequest}=require('../middleware/authmiddleware');
const {validatePostCreation}=require('../middleware/validation');
// Supports both:
// 1) POST /api/posts/ (mounted from post-service at /api/posts + router.post("/"))
// 2) POST /api/posts/create-post (gateway forwards /v1/posts/create-post -> /api/posts/create-post)
router.get("/", getPosts);
router.post("/create-post", authenticateRequest, validatePostCreation, createPost);
// Requires x-user-id (set by API gateway from JWT) so getPosts can filter by req.user.id

router.get("/:id", authenticateRequest, getPostById);
router.delete("/:id", authenticateRequest, deletePost);

module.exports = router;
