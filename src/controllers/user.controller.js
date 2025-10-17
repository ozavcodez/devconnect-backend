import User from "../models/User.model.js"
import Project from "../models/Project.model.js"

export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      })
    }

    // Get user's projects
    const projects = await Project.find({ author: user._id }).sort({ createdAt: -1 }).limit(10)

    res.status(200).json({
      status: "success",
      data: {
        user,
        projects,
      },
    })
  } catch (error) {
    next(error)
  }
}

export const updateProfile = async (req, res, next) => {
  try {
    const { bio, skills, githubUrl, linkedinUrl, portfolioUrl, avatar } = req.body

    // Only allow user to update their own profile
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({
        status: "error",
        message: "Not authorized to update this profile",
      })
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { bio, skills, githubUrl, linkedinUrl, portfolioUrl, avatar },
      { new: true, runValidators: true },
    )

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      })
    }

    res.status(200).json({
      status: "success",
      message: "Profile updated successfully",
      data: {
        user,
      },
    })
  } catch (error) {
    next(error)
  }
}

export const getAllUsers = async (req, res, next) => {
  try {
    const { search, skills, page = 1, limit = 10 } = req.query

    const query = {}

    // Search by username or email
    if (search) {
      query.$or = [{ username: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }]
    }

    // Filter by skills
    if (skills) {
      const skillsArray = skills.split(",").map((skill) => skill.trim())
      query.skills = { $in: skillsArray }
    }

    const users = await User.find(query)
      .select("-password")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 })

    const count = await User.countDocuments(query)

    res.status(200).json({
      status: "success",
      data: {
        users,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        total: count,
      },
    })
  } catch (error) {
    next(error)
  }
}
