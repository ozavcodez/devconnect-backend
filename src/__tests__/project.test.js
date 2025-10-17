import request from "supertest"
import mongoose from "mongoose"
import app from "../server.js"
import User from "../models/User.model.js"
import Project from "../models/Project.model.js"

describe("Project Endpoints", () => {
  let token
  let userId

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/devconnect-test")
  })

  afterAll(async () => {
    await User.deleteMany({})
    await Project.deleteMany({})
    await mongoose.connection.close()
  })

  beforeEach(async () => {
    await User.deleteMany({})
    await Project.deleteMany({})

    // Create and login a test user
    const response = await request(app).post("/api/auth/register").send({
      username: "testuser",
      email: "test@example.com",
      password: "password123",
    })

    token = response.body.data.token
    userId = response.body.data.user._id
  })

  describe("POST /api/projects", () => {
    it("should create a new project successfully", async () => {
      const projectData = {
        title: "Test Project",
        description: "This is a test project description",
        technologies: ["React", "Node.js"],
        category: "Web Development",
        status: "Planning",
      }

      const response = await request(app)
        .post("/api/projects")
        .set("Authorization", `Bearer ${token}`)
        .send(projectData)
        .expect(201)

      expect(response.body.status).toBe("success")
      expect(response.body.data.project).toHaveProperty("title", "Test Project")
      expect(response.body.data.project.technologies).toContain("React")
      expect(response.body.data.project.author).toHaveProperty("username", "testuser")
    })

    it("should fail without authentication", async () => {
      const projectData = {
        title: "Test Project",
        description: "This is a test project description",
      }

      const response = await request(app).post("/api/projects").send(projectData).expect(401)

      expect(response.body.status).toBe("error")
    })

    it("should fail with invalid data", async () => {
      const projectData = {
        title: "Te", // Too short
        description: "Short", // Too short
      }

      const response = await request(app)
        .post("/api/projects")
        .set("Authorization", `Bearer ${token}`)
        .send(projectData)
        .expect(400)

      expect(response.body.status).toBe("error")
    })
  })

  describe("GET /api/projects", () => {
    beforeEach(async () => {
      // Create test projects
      await Project.create([
        {
          title: "Project 1",
          description: "Description for project 1",
          author: userId,
          technologies: ["React"],
          category: "Web Development",
        },
        {
          title: "Project 2",
          description: "Description for project 2",
          author: userId,
          technologies: ["Python"],
          category: "Machine Learning",
        },
      ])
    })

    it("should get all projects", async () => {
      const response = await request(app).get("/api/projects").expect(200)

      expect(response.body.status).toBe("success")
      expect(response.body.data.projects).toHaveLength(2)
      expect(response.body.data).toHaveProperty("total", 2)
    })

    it("should filter projects by category", async () => {
      const response = await request(app).get("/api/projects?category=Web Development").expect(200)

      expect(response.body.status).toBe("success")
      expect(response.body.data.projects).toHaveLength(1)
      expect(response.body.data.projects[0].category).toBe("Web Development")
    })

    it("should search projects by title", async () => {
      const response = await request(app).get("/api/projects?search=Project 1").expect(200)

      expect(response.body.status).toBe("success")
      expect(response.body.data.projects).toHaveLength(1)
      expect(response.body.data.projects[0].title).toBe("Project 1")
    })
  })

  describe("PUT /api/projects/:id", () => {
    let projectId

    beforeEach(async () => {
      const project = await Project.create({
        title: "Original Title",
        description: "Original description",
        author: userId,
      })
      projectId = project._id
    })

    it("should update project successfully", async () => {
      const response = await request(app)
        .put(`/api/projects/${projectId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "Updated Title",
          status: "In Progress",
        })
        .expect(200)

      expect(response.body.status).toBe("success")
      expect(response.body.data.project.title).toBe("Updated Title")
      expect(response.body.data.project.status).toBe("In Progress")
    })

    it("should fail to update another users project", async () => {
      // Create another user
      const otherUserResponse = await request(app).post("/api/auth/register").send({
        username: "otheruser",
        email: "other@example.com",
        password: "password123",
      })

      const otherToken = otherUserResponse.body.data.token

      const response = await request(app)
        .put(`/api/projects/${projectId}`)
        .set("Authorization", `Bearer ${otherToken}`)
        .send({ title: "Hacked Title" })
        .expect(403)

      expect(response.body.status).toBe("error")
    })
  })

  describe("POST /api/projects/:id/like", () => {
    let projectId

    beforeEach(async () => {
      const project = await Project.create({
        title: "Test Project",
        description: "Test description",
        author: userId,
      })
      projectId = project._id
    })

    it("should like a project", async () => {
      const response = await request(app)
        .post(`/api/projects/${projectId}/like`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200)

      expect(response.body.status).toBe("success")
      expect(response.body.data.isLiked).toBe(true)
      expect(response.body.data.likes).toBe(1)
    })

    it("should unlike a project", async () => {
      // Like first
      await request(app).post(`/api/projects/${projectId}/like`).set("Authorization", `Bearer ${token}`)

      // Unlike
      const response = await request(app)
        .post(`/api/projects/${projectId}/like`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200)

      expect(response.body.status).toBe("success")
      expect(response.body.data.isLiked).toBe(false)
      expect(response.body.data.likes).toBe(0)
    })
  })
})
