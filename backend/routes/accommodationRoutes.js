/**
 * @module accommodationRoutes
 * REST routes for accommodation (listing) management.
 *
 * Base path: /api/accommodations
 *
 *   GET    /           — list all accommodations (public, supports ?location= filter)
 *   GET    /:id        — get a single accommodation (public)
 *   POST   /           — create accommodation (auth required, supports multipart image upload)
 *   PUT    /:id        — update accommodation (auth required, supports multipart image upload)
 *   DELETE /:id        — delete accommodation (auth required)
 *
 * Image uploads are handled by multer with disk storage in the /uploads directory.
 * Accepted image types: .jpg, .jpeg, .png, .webp (max 5 files per request).
 */

const express = require("express");
const multer = require("multer");
const path = require("path");
const auth = require("../middleware/auth");
const {
  getAccommodations,
  getMyAccommodations,
  getAccommodation,
  createAccommodation,
  updateAccommodation,
  deleteAccommodation
} = require("../controllers/accommodationController");

const storage = multer.diskStorage({
  destination: path.join(__dirname, "..", "uploads"),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`)
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const allowed = [".jpg", ".jpeg", ".png", ".webp"];
    cb(null, allowed.includes(path.extname(file.originalname).toLowerCase()));
  }
});

const requireRole = require("../middleware/requireRole");

const router = express.Router();

// Public — anyone can browse listings
router.get("/", getAccommodations);
router.get("/:id", getAccommodation);

// Authenticated hosts/admins only — create, read-own, update, delete
router.get("/mine", auth, requireRole("host", "admin"), getMyAccommodations);
router.post("/", auth, requireRole("host", "admin"), upload.array("images", 5), createAccommodation);
router.put("/:id", auth, requireRole("host", "admin"), upload.array("images", 5), updateAccommodation);
router.delete("/:id", auth, requireRole("host", "admin"), deleteAccommodation);

module.exports = router;
