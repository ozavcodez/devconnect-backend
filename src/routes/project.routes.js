import express from "express"
import { body } from "express-validator"
import {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
  likeProject,
  addCollaborator,
} from "../controllers/project.controller.js"
import { protect, optionalAuth } from "../middleware/auth.middleware.js"

const router = express.Router()

// Validation rules
const projectValidation = [
  body("title").trim().isLength({ min: 3, max: 100 }).withMessage("Title must be between 3 and 100 characters"),
  body("description")
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage("Description must be between 10 and 2000 characters"),
]

// Routes
router.get("/", optionalAuth, getAllProjects)
router.post("/", protect, projectValidation, createProject)
router.get("/:id", optionalAuth, getProjectById)
router.put("/:id", protect, updateProject)
router.delete("/:id", protect, deleteProject)
router.post("/:id/like", protect, likeProject)
router.post("/:id/collaborators", protect, addCollaborator)

export default router
