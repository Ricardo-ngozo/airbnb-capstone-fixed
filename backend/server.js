const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const morgan = require("morgan");
const path = require("path");

// Load environment variables as early as possible so modules can read them
dotenv.config({ path: path.join(__dirname, ".env") });

const accommodationRoutes = require("./routes/accommodationRoutes");
const reservationRoutes = require("./routes/reservationRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();
const port = process.env.PORT || 5000;
process.env.JWT_SECRET = process.env.JWT_SECRET || "dev-only-airbnb-capstone-secret";

// Configure CORS to allow frontend dev servers and any configured CLIENT_URL
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173,http://localhost:5174,http://localhost:3000").split(/[,\s]+/).filter(Boolean);
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
app.use(morgan("dev"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (_req, res) => {
  res.json({ message: "Airbnb capstone API is running" });
});

app.use("/api/accommodations", accommodationRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tapline", require("./routes/taplineRoutes"));
app.use("/api/dev", require("./routes/devseedroutes")); // TEMP: remove after seeding demo accounts once

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

const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/airbnb_capstone";
if (!process.env.MONGO_URI) console.warn("MONGO_URI not set — using default local MongoDB at", mongoUri);

const explainMongoConnectionFailure = (error) => {
  const message = error.message || String(error);
  console.error("MongoDB connection failed:", message);

  if (/querySrv/i.test(message)) {
    console.warn(
      "MongoDB Atlas DNS lookup failed. Check your internet/DNS connection, Atlas URI, and Atlas network access allowlist."
    );
  } else if (/ECONNREFUSED/i.test(message)) {
    console.warn(
      "MongoDB refused the connection. If you use local MongoDB, start mongod; if you use Atlas, check network access and credentials."
    );
  } else if (/authentication failed/i.test(message)) {
    console.warn("MongoDB authentication failed. Check the username and password in backend/.env.");
  }
};

mongoose
  .connect(mongoUri, { serverSelectionTimeoutMS: 2500 })
  .then(() => {
    app.listen(port, () => console.log(`API listening on port ${port}`));
  })
  .catch((error) => {
    explainMongoConnectionFailure(error);
    console.warn("Falling back to in-memory data store for development.");
    try {
      const initInMemory = require("./inMemoryData");
      initInMemory();
    } catch (e) {
      console.error("Failed to initialize in-memory data:", e.message || e);
    }
    app.listen(port, () => console.log(`API listening on port ${port} (in-memory mode)`));
  });