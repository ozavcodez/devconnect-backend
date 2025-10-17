import Comment from "../models/Comment.model.js"
import Project from "../models/Project.model.js"
import { validationResult } from "express-validator"

export const createComment = async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "error",
        message: "Validation failed",
        errors: errors.array(),
      })
    }

    const { content, projectId, parentCommentId } = req.body

    // Check if project exists
    const project = await Project.findById(projectId)
    if (!project) {
      return res.status(404).json({
        status: "error",
        message: "Project not found",
      })
    }

    // If replying to a comment, check if parent comment exists
    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId)
      if (!parentComment) {
        return res.status(404).json({
          status: "error",
          message: "Parent comment not found",
        })
      }
    }

    const comment = await Comment.create({
      content,
      author: req.user._id,
      project: projectId,
      parentComment: parentCommentId || null,
    })

    await comment.populate("author", "username email avatar")

    res.status(201).json({
      status: "success",
      message: "Comment created successfully",
      data: {
        comment,
      },
    })
  } catch (error) {
    next(error)
  }
}

export const getProjectComments = async (req, res, next) => {
  try {
    const { projectId } = req.params
    const { page = 1, limit = 20 } = req.query

    // Check if project exists
    const project = await Project.findById(projectId)
    if (!project) {
      return res.status(404).json({
        status: "error",
        message: "Project not found",
      })
    }

    // Get only top-level comments (no parent)
    const comments = await Comment.find({
      project: projectId,
      parentComment: null,
    })
      .populate("author", "username email avatar")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 })

    // Get replies for each comment
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await Comment.find({ parentComment: comment._id })
          .populate("author", "username email avatar")
          .sort({ createdAt: 1 })

        return {
          ...comment.toObject(),
          replies,
        }
      }),
    )

    const count = await Comment.countDocuments({
      project: projectId,
      parentComment: null,
    })

    res.status(200).json({
      status: "success",
      data: {
        comments: commentsWithReplies,
        totalPages: Math.ceil(count / limit),
        currentPage: Number.parseInt(page),
        total: count,
      },
    })
  } catch (error) {
    next(error)
  }
}

export const updateComment = async (req, res, next) => {
  try {
    const { content } = req.body
    const comment = await Comment.findById(req.params.id)

    if (!comment) {
      return res.status(404).json({
        status: "error",
        message: "Comment not found",
      })
    }

    // Check if user is the author
    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: "error",
        message: "Not authorized to update this comment",
      })
    }

    comment.content = content
    await comment.save()
    await comment.populate("author", "username email avatar")

    res.status(200).json({
      status: "success",
      message: "Comment updated successfully",
      data: {
        comment,
      },
    })
  } catch (error) {
    next(error)
  }
}

export const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id)

    if (!comment) {
      return res.status(404).json({
        status: "error",
        message: "Comment not found",
      })
    }

    // Check if user is the author
    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: "error",
        message: "Not authorized to delete this comment",
      })
    }

    // Delete all replies to this comment
    await Comment.deleteMany({ parentComment: req.params.id })

    await comment.deleteOne()

    res.status(200).json({
      status: "success",
      message: "Comment deleted successfully",
    })
  } catch (error) {
    next(error)
  }
}

export const likeComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id)

    if (!comment) {
      return res.status(404).json({
        status: "error",
        message: "Comment not found",
      })
    }

    const userId = req.user._id
    const likeIndex = comment.likes.indexOf(userId)

    if (likeIndex > -1) {
      // Unlike
      comment.likes.splice(likeIndex, 1)
    } else {
      // Like
      comment.likes.push(userId)
    }

    await comment.save()

    res.status(200).json({
      status: "success",
      message: likeIndex > -1 ? "Comment unliked" : "Comment liked",
      data: {
        likes: comment.likes.length,
        isLiked: likeIndex === -1,
      },
    })
  } catch (error) {
    next(error)
  }
}
