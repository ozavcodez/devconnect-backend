# DevConnect Backend API

A RESTful API for DevConnect - a collaboration platform where developers can create profiles, share project ideas, comment on projects, and collaborate with other developers.

## Features

- **User Authentication**: Register, login, and JWT-based authentication
- **User Profiles**: Create and manage developer profiles with skills, bio, and social links
- **Project Management**: Create, read, update, and delete project posts
- **Comments System**: Comment on projects with support for nested replies
- **Collaboration**: Add collaborators to projects and track project status
- **Like System**: Like projects and comments
- **Search & Filter**: Search projects by title, category, technologies, and more
- **Rate Limiting**: Protection against abuse with rate limiting
- **Input Validation**: Comprehensive validation using express-validator
- **Error Handling**: Centralized error handling with meaningful error messages

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: express-validator
- **Security**: Helmet, CORS, bcryptjs
- **Testing**: Jest, Supertest
- **Development**: Nodemon

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## Installation

1. **Clone the repository**
   \`\`\`bash
   git clone <repository-url>
   cd devconnect-backend
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   \`\`\`bash
   cp .env.example .env
   \`\`\`

   Update the `.env` file with your configuration:
   \`\`\`env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/devconnect
   JWT_SECRET=your_secure_jwt_secret_here
   JWT_EXPIRE=7d
   CORS_ORIGIN=http://localhost:3000
   \`\`\`

4. **Start MongoDB**
   
   Make sure MongoDB is running on your system:
   \`\`\`bash
   # macOS (with Homebrew)
   brew services start mongodb-community

   # Linux
   sudo systemctl start mongod

   # Windows
   net start MongoDB
   \`\`\`

## Running the Application

### Development Mode
\`\`\`bash
npm run dev
\`\`\`

### Production Mode
\`\`\`bash
npm start
\`\`\`

The server will start on `http://localhost:5000` (or the PORT specified in your .env file).

## Testing

### Run all tests
\`\`\`bash
npm test
\`\`\`

### Run tests in watch mode
\`\`\`bash
npm run test:watch
\`\`\`

### Test Coverage
The test suite includes:
- Authentication tests (register, login, token validation)
- Project CRUD operations tests
- Comment system tests
- Authorization and permission tests
- Input validation tests

## API Documentation

### Base URL
\`\`\`
http://localhost:5000/api
\`\`\`

### Authentication Endpoints

#### Register a new user
\`\`\`http
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123",
  "bio": "Full-stack developer",
  "skills": ["JavaScript", "React", "Node.js"]
}
\`\`\`

#### Login
\`\`\`http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
\`\`\`

#### Get current user
\`\`\`http
GET /api/auth/me
Authorization: Bearer <token>
\`\`\`

### User Endpoints

#### Get all users
\`\`\`http
GET /api/users?search=john&skills=JavaScript&page=1&limit=10
\`\`\`

#### Get user profile
\`\`\`http
GET /api/users/:id
\`\`\`

#### Update user profile
\`\`\`http
PUT /api/users/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "bio": "Updated bio",
  "skills": ["JavaScript", "TypeScript", "React"],
  "githubUrl": "https://github.com/johndoe",
  "linkedinUrl": "https://linkedin.com/in/johndoe"
}
\`\`\`

### Project Endpoints

#### Create a project
\`\`\`http
POST /api/projects
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "E-commerce Platform",
  "description": "A full-stack e-commerce platform built with MERN stack",
  "technologies": ["React", "Node.js", "MongoDB", "Express"],
  "category": "Web Development",
  "status": "In Progress",
  "lookingForCollaborators": true,
  "repositoryUrl": "https://github.com/johndoe/ecommerce",
  "liveUrl": "https://myecommerce.com"
}
\`\`\`

#### Get all projects
\`\`\`http
GET /api/projects?search=ecommerce&category=Web Development&technologies=React&status=In Progress&page=1&limit=10
\`\`\`

#### Get project by ID
\`\`\`http
GET /api/projects/:id
\`\`\`

#### Update project
\`\`\`http
PUT /api/projects/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "Completed",
  "lookingForCollaborators": false
}
\`\`\`

#### Delete project
\`\`\`http
DELETE /api/projects/:id
Authorization: Bearer <token>
\`\`\`

#### Like/Unlike project
\`\`\`http
POST /api/projects/:id/like
Authorization: Bearer <token>
\`\`\`

#### Add collaborator
\`\`\`http
POST /api/projects/:id/collaborators
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "user_id_here"
}
\`\`\`

### Comment Endpoints

#### Create a comment
\`\`\`http
POST /api/comments
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Great project! Would love to collaborate.",
  "projectId": "project_id_here"
}
\`\`\`

#### Create a reply
\`\`\`http
POST /api/comments
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Thanks! Let's connect.",
  "projectId": "project_id_here",
  "parentCommentId": "parent_comment_id_here"
}
\`\`\`

#### Get project comments
\`\`\`http
GET /api/comments/project/:projectId?page=1&limit=20
\`\`\`

#### Update comment
\`\`\`http
PUT /api/comments/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Updated comment text"
}
\`\`\`

#### Delete comment
\`\`\`http
DELETE /api/comments/:id
Authorization: Bearer <token>
\`\`\`

#### Like/Unlike comment
\`\`\`http
POST /api/comments/:id/like
Authorization: Bearer <token>
\`\`\`

### Health Check
\`\`\`http
GET /api/health
\`\`\`

## Response Format

### Success Response
\`\`\`json
{
  "status": "success",
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
\`\`\`

### Error Response
\`\`\`json
{
  "status": "error",
  "message": "Error message here",
  "errors": [] // Optional validation errors
}
\`\`\`

## Error Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

## Security Features

- **Password Hashing**: Passwords are hashed using bcryptjs
- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Protection against brute force attacks
- **Helmet**: Security headers
- **CORS**: Configurable cross-origin resource sharing
- **Input Validation**: All inputs are validated and sanitized
- **Authorization**: Route-level permission checks

## Project Structure

\`\`\`
devconnect-backend/
├── src/
│   ├── __tests__/          # Test files
│   │   ├── auth.test.js
│   │   ├── project.test.js
│   │   └── comment.test.js
│   ├── config/             # Configuration files
│   │   └── database.js
│   ├── controllers/        # Route controllers
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── project.controller.js
│   │   └── comment.controller.js
│   ├── middleware/         # Custom middleware
│   │   ├── auth.middleware.js
│   │   ├── error.middleware.js
│   │   └── rateLimiter.middleware.js
│   ├── models/            # Mongoose models
│   │   ├── User.model.js
│   │   ├── Project.model.js
│   │   └── Comment.model.js
│   ├── routes/            # API routes
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── project.routes.js
│   │   └── comment.routes.js
│   ├── utils/             # Utility functions
│   │   └── jwt.utils.js
│   └── server.js          # Application entry point
├── .env.example           # Environment variables template
├── .gitignore
├── jest.config.js         # Jest configuration
├── package.json
└── README.md
\`\`\`

## Database Schema

### User
- username (String, unique, required)
- email (String, unique, required)
- password (String, hashed, required)
- bio (String)
- skills (Array of Strings)
- githubUrl, linkedinUrl, portfolioUrl (Strings)
- avatar (String, URL)
- timestamps

### Project
- title (String, required)
- description (String, required)
- technologies (Array of Strings)
- category (Enum)
- status (Enum)
- lookingForCollaborators (Boolean)
- repositoryUrl, liveUrl (Strings)
- author (Reference to User)
- collaborators (Array of User references)
- likes (Array of User references)
- views (Number)
- timestamps

### Comment
- content (String, required)
- author (Reference to User)
- project (Reference to Project)
- parentComment (Reference to Comment, for replies)
- likes (Array of User references)
- timestamps

## Postman Collection

To test the API endpoints, you can create a Postman collection with the following structure:

1. Create a new collection named "DevConnect API"
2. Add environment variables:
   - `base_url`: 
   - `token`: (will be set after login)
3. Import the endpoints from the API Documentation section above
4. Use the `{{token}}` variable in Authorization headers

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please open an issue on the GitHub repository.



