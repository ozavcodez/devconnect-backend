import express from "express"
import { getUserProfile, updateProfile, getAllUsers } from "../controllers/user.controller.js"
import { protect } from "../middleware/auth.middleware.js"

const router = express.Router()

router.get("/", getAllUsers)
router.get("/:id", getUserProfile)
router.put("/:id", protect, updateProfile)

export default router
