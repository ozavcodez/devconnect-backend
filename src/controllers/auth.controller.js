import User from "../models/User.model.js"
import { generateToken } from "../utils/jwt.utils.js"
import { validationResult } from "express-validator"

export const register = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "error",
        message: "Validation failed",
        errors: errors.array(),
      })
    }

    const { username, email, password, bio, skills } = req.body

    // Create user
    const user = await User.create({
      username,
      email,
      password,
      bio,
      skills,
    })

    // Generate token
    const token = generateToken(user._id)

    res.status(201).json({
      status: "success",
      message: "User registered successfully",
      data: {
        user,
        token,
      },
    })
  } catch (error) {
    next(error)
  }
}

export const login = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "error",
        message: "Validation failed",
        errors: errors.array(),
      })
    }

    const { email, password } = req.body

    // Check if user exists
    const user = await User.findOne({ email }).select("+password")

    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "Invalid credentials",
      })
    }

    // Check password
    const isPasswordCorrect = await user.comparePassword(password)

    if (!isPasswordCorrect) {
      return res.status(401).json({
        status: "error",
        message: "Invalid credentials",
      })
    }

    // Generate token
    const token = generateToken(user._id)

    // Remove password from output
    user.password = undefined

    res.status(200).json({
      status: "success",
      message: "Login successful",
      data: {
        user,
        token,
      },
    })
  } catch (error) {
    next(error)
  }
}

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)

    res.status(200).json({
      status: "success",
      data: {
        user,
      },
    })
  } catch (error) {
    next(error)
  }
}
