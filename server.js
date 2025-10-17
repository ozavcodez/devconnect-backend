import express from "express"
import cors from "cors"
import helmet from "helmet"
import dotenv from "dotenv"
import connectDB from "./src/config/database.js"
import authRoutes from "./src/routes/auth.routes.js"
import projectRoutes from "./src/routes/project.routes.js"
import commentRoutes from "./src/routes/comment.routes.js"
import userRoutes from "./src/routes/user.routes.js"
import { errorHandler } from "./src/middleware/error.middleware.js"
import { rateLimiter } from "./src/middleware/rateLimiter.middleware.js"
dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

app.set('trust proxy', 1);

// Connect to Database
connectDB()

// Middleware
app.use(helmet())
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  }),
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Rate limiting
app.use("/api/", rateLimiter)

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "DevConnect API is running",
    timestamp: new Date().toISOString(),
  })
})

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)
app.use("/api/projects", projectRoutes)
app.use("/api/comments", commentRoutes)

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    status: "error",
    message: `Route ${req.originalUrl} not found`,
  })
})

// Error handling middleware (must be last)
app.use(errorHandler)

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
})

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION! 💥 Shutting down...")
  console.error(err.name, err.message)
  server.close(() => {
    process.exit(1)
  })
})

export default app
