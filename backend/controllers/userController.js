/**
 * @module userController
 * Handles user authentication: registration, login, and profile retrieval.
 *
 * Routes:
 *   POST /api/users/register — create a new user account
 *   POST /api/users/login    — authenticate and receive a JWT token
 *   GET  /api/users/profile  — return the authenticated user's profile (auth required)
 */

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Sign a JWT for the given user document.
 * @param {object} user - User document (must have _id and role)
 * @returns {string} Signed JWT valid for 7 days
 */
const createToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });

/**
 * POST /api/users/register
 * Create a new user account. Validates required fields, checks for duplicate
 * email, hashes the password with bcrypt, and returns a signed JWT token.
 *
 * @param {object} req.body - { username, email, password, role? }
 * @returns {object} 201 - { token, user: { id, username, email, role } }
 */
const register = async (req, res, next) => {
  try {
    const { username, email, password, role } = req.body;

    // Basic field validation
    if (!username || !email || !password) {
      return res.status(400).json({ message: "Username, email, and password are required" });
    }
    if (!email.includes("@")) {
      return res.status(400).json({ message: "Please provide a valid email address" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Prevent self-assigning admin role — only "user" and "host" are allowed
    const allowedRoles = ["user", "host"];
    const assignedRole = allowedRoles.includes(role) ? role : "user";

    // Check for duplicate email
    if (global.IN_MEMORY) {
      const exists = (global.inMemoryUsers || []).find((u) => u.email === normalizedEmail);
      if (exists) return res.status(409).json({ message: "An account with that email already exists" });

      const hashed = await bcrypt.hash(password, 10);
      const newUser = {
        _id: `inmem-${Date.now()}`,
        username: username.trim(),
        email: normalizedEmail,
        password: hashed,
        role: assignedRole
      };
      global.inMemoryUsers.push(newUser);

      return res.status(201).json({
        token: createToken(newUser),
        user: { id: newUser._id, username: newUser.username, email: newUser.email, role: newUser.role }
      });
    }

    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) return res.status(409).json({ message: "An account with that email already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      username: username.trim(),
      email: normalizedEmail,
      password: hashed,
      role: assignedRole
    });

    res.status(201).json({
      token: createToken(newUser),
      user: { id: newUser._id, username: newUser.username, email: newUser.email, role: newUser.role }
    });
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
};

/**
 * POST /api/users/login
 * Authenticate a user with email + password. Returns a signed JWT token.
 *
 * @param {object} req.body - { email, password }
 * @returns {object} 200 - { token, user: { id, username, email, role } }
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    let user;
    if (global.IN_MEMORY) {
      user = (global.inMemoryUsers || []).find((u) => u.email === email.toLowerCase());
    } else {
      user = await User.findOne({ email: email.toLowerCase() });
    }

    const validPassword = user ? await bcrypt.compare(password, user.password) : false;

    if (!user || !validPassword) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.json({
      token: createToken(user),
      user: { id: user._id, username: user.username, email: user.email, role: user.role }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/profile
 * Return the profile of the currently authenticated user.
 * Requires a valid Bearer token (set by auth middleware).
 *
 * @returns {object} 200 - { user }
 */
const profile = async (req, res) => {
  res.json({ user: req.user });
};

/**
 * PUT /api/users/profile
 * Update the authenticated user's username and/or password.
 *
 * @body {string} username  — new display name (optional)
 * @body {string} currentPassword — required when changing password
 * @body {string} newPassword     — new password (optional)
 */
const updateProfile = async (req, res, next) => {
  try {
    const { username, currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    if (global.IN_MEMORY) {
      const index = (global.inMemoryUsers || []).findIndex((u) => String(u._id) === String(userId));
      if (index === -1) return res.status(404).json({ message: "User not found" });

      const user = global.inMemoryUsers[index];

      if (newPassword) {
        if (!currentPassword) return res.status(400).json({ message: "Current password is required" });
        const valid = await bcrypt.compare(currentPassword, user.password);
        if (!valid) return res.status(401).json({ message: "Current password is incorrect" });
        if (newPassword.length < 6) return res.status(400).json({ message: "New password must be at least 6 characters" });
        user.password = await bcrypt.hash(newPassword, 10);
      }

      if (username) user.username = username.trim();
      global.inMemoryUsers[index] = user;

      return res.json({
        token: createToken(user),
        user: { id: user._id, username: user.username, email: user.email, role: user.role }
      });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (newPassword) {
      if (!currentPassword) return res.status(400).json({ message: "Current password is required" });
      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid) return res.status(401).json({ message: "Current password is incorrect" });
      if (newPassword.length < 6) return res.status(400).json({ message: "New password must be at least 6 characters" });
      user.password = await bcrypt.hash(newPassword, 10);
    }

    if (username) user.username = username.trim();
    await user.save();

    res.json({
      token: createToken(user),
      user: { id: user._id, username: user.username, email: user.email, role: user.role }
    });
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
};

module.exports = { register, login, profile, updateProfile };
