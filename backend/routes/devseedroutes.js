/**
 * ONE-TIME USE — seeds the 3 demo login accounts by visiting a URL in the
 * browser. No local .env or Node needed since it runs on the already-deployed
 * Render service, which already has MONGO_URI set.
 *
 * DELETE THIS FILE (and its app.use line in server.js) after you've used it once.
 */
const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const router = express.Router();

const SECRET_KEY = "e4a20345dc66"; // one-time secret, remove this file after use

const accounts = [
  { username: "Guest Demo", email: "guest@demo.com", password: "Guest123!", role: "user" },
  { username: "Host Demo", email: "host@demo.com", password: "Host123!", role: "host" },
  { username: "Admin Demo", email: "admin@demo.com", password: "Admin123!", role: "admin" }
];

router.get("/seed-demo-accounts", async (req, res) => {
  if (req.query.key !== SECRET_KEY) {
    return res.status(403).json({ message: "Forbidden" });
  }
  try {
    const results = [];
    for (const acc of accounts) {
      const hashed = await bcrypt.hash(acc.password, 10);
      const existing = await User.findOne({ email: acc.email });
      if (existing) {
        existing.password = hashed;
        existing.role = acc.role;
        existing.username = acc.username;
        await existing.save();
        results.push(`updated ${acc.email} (${acc.role})`);
      } else {
        await User.create({ username: acc.username, email: acc.email, password: hashed, role: acc.role });
        results.push(`created ${acc.email} (${acc.role})`);
      }
    }
    res.json({ message: "Seed complete", results });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;