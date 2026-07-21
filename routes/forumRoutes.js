import express from "express";
import {
  getThreads,
  createThread,
  getThread,
  addReply,
  solveThread,
  markReplyAsSolution,
  upvoteThread,
  upvoteReply,
} from "../controllers/forumController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @route   GET /api/forum/threads
 * @desc    Fetch all threads with filters
 * @access  Public
 */
router.get("/threads", getThreads);

/**
 * @route   POST /api/forum/threads/new
 * @desc    Initialize a new thread
 * @access  Private
 */
router.post("/threads/new", authMiddleware, createThread);

/**
 * @route   GET /api/forum/threads/:id
 * @desc    Get single thread details and replies
 * @access  Public
 */
router.get("/threads/:id", getThread);

/**
 * @route   POST /api/forum/threads/:id/replies
 * @desc    Add a reply to a thread
 * @access  Private
 */
router.post("/threads/:id/replies", authMiddleware, addReply);

/**
 * @route   PATCH /api/forum/threads/:id/solve
 * @desc    Mark a thread as solved
 * @access  Private (Thread author only)
 */
router.patch("/threads/:id/solve", authMiddleware, solveThread);

/**
 * @route   PATCH /api/forum/threads/:id/replies/:replyId/solution
 * @desc    Mark a reply as the solution for a thread
 * @access  Private (Thread author only)
 */
router.patch("/threads/:id/replies/:replyId/solution", authMiddleware, markReplyAsSolution);

/**
 * @route   POST /api/forum/threads/:id/upvote
 * @desc    Upvote a thread and award XP to the author
 * @access  Private
 */
router.post("/threads/:id/upvote", authMiddleware, upvoteThread);

/**
 * @route   POST /api/forum/threads/:id/replies/:replyId/upvote
 * @desc    Upvote a reply and award XP to the author
 * @access  Private
 */
router.post("/threads/:id/replies/:replyId/upvote", authMiddleware, upvoteReply);

export default router;
