/**
 * Creates/updates the 3 demo login accounts (guest, host, admin) WITHOUT
 * touching accommodations, reservations, or any other users.
 * Safe to run against production (upsert, not delete-all).
 *
 * Usage: node seed/seedAccounts.js
 * Requires MONGO_URI in backend/.env (or exported in the shell) pointing
 * at the SAME database your Render backend uses.
 */
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const path = require("path");
const User = require("../models/User");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const accounts = [
  { username: "Guest Demo", email: "guest@demo.com", password: "Guest123!", role: "user" },
  { username: "Host Demo", email: "host@demo.com", password: "Host123!", role: "host" },
  { username: "Admin Demo", email: "admin@demo.com", password: "Admin123!", role: "admin" }
];

const run = async () => {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is not set. Put it in backend/.env before running this script.");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to:", process.env.MONGO_URI.replace(/\/\/.*@/, "//<credentials>@"));

  for (const acc of accounts) {
    const hashed = await bcrypt.hash(acc.password, 10);
    const existing = await User.findOne({ email: acc.email });

    if (existing) {
      existing.password = hashed;
      existing.role = acc.role;
      existing.username = acc.username;
      await existing.save();
      console.log(`Updated: ${acc.email} (${acc.role})`);
    } else {
      await User.create({ username: acc.username, email: acc.email, password: hashed, role: acc.role });
      console.log(`Created: ${acc.email} (${acc.role})`);
    }
  }

  console.log("\nDone. Login credentials:");
  accounts.forEach((a) => console.log(`  ${a.role.padEnd(6)} -> ${a.email} / ${a.password}`));

  await mongoose.disconnect();
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
