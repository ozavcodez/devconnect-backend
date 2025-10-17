import express from "express"
import { body } from "express-validator"
import {
  createComment,
  getProjectComments,
  updateComment,
  deleteComment,
  likeComment,
} from "../controllers/comment.controller.js"
import { protect, optionalAuth } from "../middleware/auth.middleware.js"

const router = express.Router()

// Validation rules
const commentValidation = [
  body("content").trim().isLength({ min: 1, max: 1000 }).withMessage("Comment must be between 1 and 1000 characters"),
  body("projectId").notEmpty().withMessage("Project ID is required"),
]

// Routes
router.post("/", protect, commentValidation, createComment)
router.get("/project/:projectId", optionalAuth, getProjectComments)
router.put("/:id", protect, updateComment)
router.delete("/:id", protect, deleteComment)
router.post("/:id/like", protect, likeComment)

export default router
