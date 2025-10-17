import express from "express"
import { body } from "express-validator"
import { register, login, getMe } from "../controllers/auth.controller.js"
import { protect } from "../middleware/auth.middleware.js"
import { authLimiter } from "../middleware/rateLimiter.middleware.js"

const router = express.Router()

// Validation rules
const registerValidation = [
  body("username").trim().isLength({ min: 3, max: 30 }).withMessage("Username must be between 3 and 30 characters"),
  body("email").trim().isEmail().normalizeEmail().withMessage("Please provide a valid email"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
]

const loginValidation = [
  body("email").trim().isEmail().normalizeEmail().withMessage("Please provide a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
]

// Routes
router.post("/register", authLimiter, registerValidation, register)
router.post("/login", authLimiter, loginValidation, login)
router.get("/me", protect, getMe)

export default router
