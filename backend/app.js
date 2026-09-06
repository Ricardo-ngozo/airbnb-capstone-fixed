/**
 * @module app
 * Builds and returns the Express app WITHOUT starting a server or connecting
 * to MongoDB. Kept separate from server.js so tests (Jest + Supertest) can
 * import the app directly.
 */
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");

const accommodationRoutes = require("./routes/accommodationRoutes");
const reservationRoutes = require("./routes/reservationRoutes");
const userRoutes = require("./routes/userRoutes");

process.env.JWT_SECRET = process.env.JWT_SECRET || "dev-only-airbnb-capstone-secret";

const app = express();

const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173,http://localhost:5174,http://localhost:3000")
  .split(/[,\s]+/)
  .filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
      return callback(new Error("CORS policy: Origin not allowed"));
    },
    credentials: true
  })
);
app.use(express.json());
if (process.env.NODE_ENV !== "test") app.use(morgan("dev"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (_req, res) => {
  res.json({ message: "Airbnb capstone API is running" });
});

app.use("/api/accommodations", accommodationRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tapline", require("./routes/taplineRoutes"));
app.use("/api/dev", require("./routes/devSeedRoutes")); // TEMP: remove after seeding demo accounts once

app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
});

app.use((err, _req, res, _next) => {
  const status = err.statusCode || 500;
  res.status(status).json({
    message: err.message || "Server error",
    errors: err.errors || undefined
  });
});

module.exports = app;
