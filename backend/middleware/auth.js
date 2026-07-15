/**
 * @module auth
 * Authentication middleware for Express routes.
 *
 * Reads the Authorization header, verifies the Bearer JWT token using
 * JWT_SECRET, then attaches the authenticated user to req.user.
 *
 * In in-memory mode (global.IN_MEMORY), users are looked up from the
 * global.inMemoryUsers array instead of MongoDB.
 *
 * Returns 401 if:
 *   - No token is provided
 *   - The token is invalid or expired
 *   - The user referenced by the token no longer exists
 */

const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Express middleware that validates a JWT Bearer token and attaches the
 * decoded user to req.user. Call next() on success, or send 401 on failure.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const auth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: "Authentication token is required" });
    }

    // Verify and decode the JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (global.IN_MEMORY) {
      // Look up the user in the in-memory store (no DB query needed)
      const user = (global.inMemoryUsers || []).find((u) => String(u._id) === String(decoded.id));
      if (!user) return res.status(401).json({ message: "User session is no longer valid" });

      // Strip the password before attaching to the request
      const { password: _pw, ...publicUser } = user;
      req.user = publicUser;
      return next();
    }

    // MongoDB path: look up the user and exclude the password field
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "User session is no longer valid" });
    }

    req.user = user;
    next();
  } catch (error) {
    const msg =
      error?.name === "TokenExpiredError"
        ? "Session expired — please log in again"
        : "Invalid or expired token";
    res.status(401).json({ message: msg });
  }
};

module.exports = auth;
