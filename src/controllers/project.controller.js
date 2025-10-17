import Project from "../models/Project.model.js"
import Comment from "../models/Comment.model.js"
import { validationResult } from "express-validator"

export const createProject = async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "error",
        message: "Validation failed",
        errors: errors.array(),
      })
    }

    const projectData = {
      ...req.body,
      author: req.user._id,
    }

    const project = await Project.create(projectData)
    await project.populate("author", "username email avatar")

    res.status(201).json({
      status: "success",
      message: "Project created successfully",
      data: {
        project,
      },
    })
  } catch (error) {
    next(error)
  }
}

export const getAllProjects = async (req, res, next) => {
  try {
    const {
      search,
      category,
      technologies,
      status,
      lookingForCollaborators,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      order = "desc",
    } = req.query

    const query = {}

    // Search by title or description
    if (search) {
      query.$or = [{ title: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }]
    }

    // Filter by category
    if (category) {
      query.category = category
    }

    // Filter by technologies
    if (technologies) {
      const techArray = technologies.split(",").map((tech) => tech.trim())
      query.technologies = { $in: techArray }
    }

    // Filter by status
    if (status) {
      query.status = status
    }

    // Filter by collaboration status
    if (lookingForCollaborators !== undefined) {
      query.lookingForCollaborators = lookingForCollaborators === "true"
    }

    const sortOrder = order === "asc" ? 1 : -1
    const sortOptions = { [sortBy]: sortOrder }

    const projects = await Project.find(query)
      .populate("author", "username email avatar")
      .populate("collaborators", "username email avatar")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort(sortOptions)

    const count = await Project.countDocuments(query)

    res.status(200).json({
      status: "success",
      data: {
        projects,
        totalPages: Math.ceil(count / limit),
        currentPage: Number.parseInt(page),
        total: count,
      },
    })
  } catch (error) {
    next(error)
  }
}

export const getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("author", "username email avatar bio skills")
      .populate("collaborators", "username email avatar")
      .populate("likes", "username avatar")

    if (!project) {
      return res.status(404).json({
        status: "error",
        message: "Project not found",
      })
    }

    // Increment views
    project.views += 1
    await project.save()

    res.status(200).json({
      status: "success",
      data: {
        project,
      },
    })
  } catch (error) {
    next(error)
  }
}

export const updateProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)

    if (!project) {
      return res.status(404).json({
        status: "error",
        message: "Project not found",
      })
    }

    // Check if user is the author
    if (project.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: "error",
        message: "Not authorized to update this project",
      })
    }

    const updatedProject = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("author", "username email avatar")

    res.status(200).json({
      status: "success",
      message: "Project updated successfully",
      data: {
        project: updatedProject,
      },
    })
  } catch (error) {
    next(error)
  }
}

export const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)

    if (!project) {
      return res.status(404).json({
        status: "error",
        message: "Project not found",
      })
    }

    // Check if user is the author
    if (project.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: "error",
        message: "Not authorized to delete this project",
      })
    }

    // Delete all comments associated with the project
    await Comment.deleteMany({ project: req.params.id })

    await project.deleteOne()

    res.status(200).json({
      status: "success",
      message: "Project deleted successfully",
    })
  } catch (error) {
    next(error)
  }
}

export const likeProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)

    if (!project) {
      return res.status(404).json({
        status: "error",
        message: "Project not found",
      })
    }

    const userId = req.user._id
    const likeIndex = project.likes.indexOf(userId)

    if (likeIndex > -1) {
      // Unlike
      project.likes.splice(likeIndex, 1)
    } else {
      // Like
      project.likes.push(userId)
    }

    await project.save()

    res.status(200).json({
      status: "success",
      message: likeIndex > -1 ? "Project unliked" : "Project liked",
      data: {
        likes: project.likes.length,
        isLiked: likeIndex === -1,
      },
    })
  } catch (error) {
    next(error)
  }
}

export const addCollaborator = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)

    if (!project) {
      return res.status(404).json({
        status: "error",
        message: "Project not found",
      })
    }

    // Check if user is the author
    if (project.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: "error",
        message: "Only the project author can add collaborators",
      })
    }

    const { userId } = req.body

    // Check if already a collaborator
    if (project.collaborators.includes(userId)) {
      return res.status(400).json({
        status: "error",
        message: "User is already a collaborator",
      })
    }

    project.collaborators.push(userId)
    await project.save()
    await project.populate("collaborators", "username email avatar")

    res.status(200).json({
      status: "success",
      message: "Collaborator added successfully",
      data: {
        project,
      },
    })
  } catch (error) {
    next(error)
  }
}
