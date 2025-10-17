import request from "supertest"
import mongoose from "mongoose"
import app from "../server.js"
import User from "../models/User.model.js"
import Project from "../models/Project.model.js"
import Comment from "../models/Comment.model.js"

describe("Comment Endpoints", () => {
  let token
  let userId
  let projectId

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/devconnect-test")
  })

  afterAll(async () => {
    await User.deleteMany({})
    await Project.deleteMany({})
    await Comment.deleteMany({})
    await mongoose.connection.close()
  })

  beforeEach(async () => {
    await User.deleteMany({})
    await Project.deleteMany({})
    await Comment.deleteMany({})

    // Create and login a test user
    const userResponse = await request(app).post("/api/auth/register").send({
      username: "testuser",
      email: "test@example.com",
      password: "password123",
    })

    token = userResponse.body.data.token
    userId = userResponse.body.data.user._id

    // Create a test project
    const projectResponse = await request(app).post("/api/projects").set("Authorization", `Bearer ${token}`).send({
      title: "Test Project",
      description: "Test project description",
    })

    projectId = projectResponse.body.data.project._id
  })

  describe("POST /api/comments", () => {
    it("should create a comment successfully", async () => {
      const commentData = {
        content: "This is a test comment",
        projectId: projectId,
      }

      const response = await request(app)
        .post("/api/comments")
        .set("Authorization", `Bearer ${token}`)
        .send(commentData)
        .expect(201)

      expect(response.body.status).toBe("success")
      expect(response.body.data.comment).toHaveProperty("content", "This is a test comment")
      expect(response.body.data.comment.author).toHaveProperty("username", "testuser")
    })

    it("should create a reply to a comment", async () => {
      // Create parent comment
      const parentResponse = await request(app).post("/api/comments").set("Authorization", `Bearer ${token}`).send({
        content: "Parent comment",
        projectId: projectId,
      })

      const parentCommentId = parentResponse.body.data.comment._id

      // Create reply
      const response = await request(app)
        .post("/api/comments")
        .set("Authorization", `Bearer ${token}`)
        .send({
          content: "Reply to comment",
          projectId: projectId,
          parentCommentId: parentCommentId,
        })
        .expect(201)

      expect(response.body.status).toBe("success")
      expect(response.body.data.comment.parentComment).toBe(parentCommentId)
    })

    it("should fail without authentication", async () => {
      const response = await request(app)
        .post("/api/comments")
        .send({
          content: "Test comment",
          projectId: projectId,
        })
        .expect(401)

      expect(response.body.status).toBe("error")
    })
  })

  describe("GET /api/comments/project/:projectId", () => {
    beforeEach(async () => {
      // Create test comments
      await Comment.create([
        {
          content: "Comment 1",
          author: userId,
          project: projectId,
        },
        {
          content: "Comment 2",
          author: userId,
          project: projectId,
        },
      ])
    })

    it("should get all comments for a project", async () => {
      const response = await request(app).get(`/api/comments/project/${projectId}`).expect(200)

      expect(response.body.status).toBe("success")
      expect(response.body.data.comments).toHaveLength(2)
    })
  })

  describe("PUT /api/comments/:id", () => {
    let commentId

    beforeEach(async () => {
      const comment = await Comment.create({
        content: "Original comment",
        author: userId,
        project: projectId,
      })
      commentId = comment._id
    })

    it("should update comment successfully", async () => {
      const response = await request(app)
        .put(`/api/comments/${commentId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ content: "Updated comment" })
        .expect(200)

      expect(response.body.status).toBe("success")
      expect(response.body.data.comment.content).toBe("Updated comment")
    })

    it("should fail to update another users comment", async () => {
      // Create another user
      const otherUserResponse = await request(app).post("/api/auth/register").send({
        username: "otheruser",
        email: "other@example.com",
        password: "password123",
      })

      const otherToken = otherUserResponse.body.data.token

      const response = await request(app)
        .put(`/api/comments/${commentId}`)
        .set("Authorization", `Bearer ${otherToken}`)
        .send({ content: "Hacked comment" })
        .expect(403)

      expect(response.body.status).toBe("error")
    })
  })

  describe("POST /api/comments/:id/like", () => {
    let commentId

    beforeEach(async () => {
      const comment = await Comment.create({
        content: "Test comment",
        author: userId,
        project: projectId,
      })
      commentId = comment._id
    })

    it("should like a comment", async () => {
      const response = await request(app)
        .post(`/api/comments/${commentId}/like`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200)

      expect(response.body.status).toBe("success")
      expect(response.body.data.isLiked).toBe(true)
      expect(response.body.data.likes).toBe(1)
    })

    it("should unlike a comment", async () => {
      // Like first
      await request(app).post(`/api/comments/${commentId}/like`).set("Authorization", `Bearer ${token}`)

      // Unlike
      const response = await request(app)
        .post(`/api/comments/${commentId}/like`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200)

      expect(response.body.status).toBe("success")
      expect(response.body.data.isLiked).toBe(false)
      expect(response.body.data.likes).toBe(0)
    })
  })
})
