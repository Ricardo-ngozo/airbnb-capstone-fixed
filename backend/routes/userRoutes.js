/**
 * @module userRoutes
 * Routes for user authentication and profile management.
 *
 * Base path: /api/users
 *
 * Routes:
 *   POST   /register — create a new user account (open)
 *   POST   /login    — authenticate and receive a JWT (open)
 *   GET    /profile  — return current user's profile (auth required)
 */

const express = require("express");
const auth = require("../middleware/auth");
const { register, login, profile, updateProfile } = require("../controllers/userController");

const router = express.Router();

// Register a new user account
router.post("/register", register);

// Log in with email + password → receive JWT token
router.post("/login", login);

// Get the authenticated user's profile
router.get("/profile", auth, profile);

// Update the authenticated user's profile (username / password)
router.put("/profile", auth, updateProfile);

module.exports = router;

