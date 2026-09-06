/**
 * @module server
 * Entry point: connects to MongoDB (falling back to in-memory data if the
 * connection fails) then starts the Express app defined in app.js.
 */
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

const app = require("./app");

const port = process.env.PORT || 5000;
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
