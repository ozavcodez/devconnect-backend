import request from "supertest"
import mongoose from "mongoose"
import app from "../server.js"
import User from "../models/User.model.js"

describe("Authentication Endpoints", () => {
  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/devconnect-test")
  })

  afterAll(async () => {
    // Clean up and close connection
    await User.deleteMany({})
    await mongoose.connection.close()
  })

  beforeEach(async () => {
    // Clear users before each test
    await User.deleteMany({})
  })

  describe("POST /api/auth/register", () => {
    it("should register a new user successfully", async () => {
      const userData = {
        username: "testuser",
        email: "test@example.com",
        password: "password123",
      }

      const response = await request(app).post("/api/auth/register").send(userData).expect(201)

      expect(response.body.status).toBe("success")
      expect(response.body.data.user).toHaveProperty("username", "testuser")
      expect(response.body.data.user).toHaveProperty("email", "test@example.com")
      expect(response.body.data).toHaveProperty("token")
      expect(response.body.data.user).not.toHaveProperty("password")
    })

    it("should fail with invalid email", async () => {
      const userData = {
        username: "testuser",
        email: "invalid-email",
        password: "password123",
      }

      const response = await request(app).post("/api/auth/register").send(userData).expect(400)

      expect(response.body.status).toBe("error")
    })

    it("should fail with short password", async () => {
      const userData = {
        username: "testuser",
        email: "test@example.com",
        password: "123",
      }

      const response = await request(app).post("/api/auth/register").send(userData).expect(400)

      expect(response.body.status).toBe("error")
    })

    it("should fail with duplicate email", async () => {
      const userData = {
        username: "testuser",
        email: "test@example.com",
        password: "password123",
      }

      // Register first user
      await request(app).post("/api/auth/register").send(userData)

      // Try to register with same email
      const response = await request(app)
        .post("/api/auth/register")
        .send({ ...userData, username: "differentuser" })
        .expect(400)

      expect(response.body.status).toBe("error")
      expect(response.body.message).toContain("already exists")
    })
  })

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      // Create a test user
      await request(app).post("/api/auth/register").send({
        username: "testuser",
        email: "test@example.com",
        password: "password123",
      })
    })

    it("should login successfully with correct credentials", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "test@example.com",
          password: "password123",
        })
        .expect(200)

      expect(response.body.status).toBe("success")
      expect(response.body.data).toHaveProperty("token")
      expect(response.body.data.user).toHaveProperty("email", "test@example.com")
    })

    it("should fail with incorrect password", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "test@example.com",
          password: "wrongpassword",
        })
        .expect(401)

      expect(response.body.status).toBe("error")
      expect(response.body.message).toBe("Invalid credentials")
    })

    it("should fail with non-existent email", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "nonexistent@example.com",
          password: "password123",
        })
        .expect(401)

      expect(response.body.status).toBe("error")
      expect(response.body.message).toBe("Invalid credentials")
    })
  })

  describe("GET /api/auth/me", () => {
    let token

    beforeEach(async () => {
      // Register and get token
      const response = await request(app).post("/api/auth/register").send({
        username: "testuser",
        email: "test@example.com",
        password: "password123",
      })

      token = response.body.data.token
    })

    it("should get current user with valid token", async () => {
      const response = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`).expect(200)

      expect(response.body.status).toBe("success")
      expect(response.body.data.user).toHaveProperty("email", "test@example.com")
    })

    it("should fail without token", async () => {
      const response = await request(app).get("/api/auth/me").expect(401)

      expect(response.body.status).toBe("error")
    })

    it("should fail with invalid token", async () => {
      const response = await request(app).get("/api/auth/me").set("Authorization", "Bearer invalidtoken").expect(401)

      expect(response.body.status).toBe("error")
    })
  })
})
