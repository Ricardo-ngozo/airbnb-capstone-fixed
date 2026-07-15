/**
 * @module reservationRoutes
 * REST routes for reservation (booking) management.
 *
 * Base path: /api/reservations
 *
 * All routes require a valid Bearer token (auth middleware).
 *
 *   POST   /       — create a new reservation
 *   GET    /host   — list reservations for the authenticated host's accommodations
 *   GET    /user   — list reservations made by the authenticated user (guest)
 *   DELETE /:id    — cancel / delete a reservation (only guest or host may delete)
 */

const express = require("express");
const auth = require("../middleware/auth");
const {
  createReservation,
  getHostReservations,
  getUserReservations,
  deleteReservation,
  getDashboardStats,
  getAvailability
} = require("../controllers/reservationController");

const requireRole = require("../middleware/requireRole");

const router = express.Router();

// Create a new reservation (any authenticated user can book)
router.post("/", auth, createReservation);

// Dashboard summary stats for the authenticated user
router.get("/stats", auth, getDashboardStats);

// Get all reservations for the authenticated host's listings
router.get("/host", auth, getHostReservations);

// Get all reservations made by the authenticated user (guest view)
router.get("/user", auth, getUserReservations);

// Get booked dates for a specific accommodation (public — used by calendar UI)
router.get("/availability/:accommodationId", getAvailability);

// Cancel / delete a reservation by ID (guest or host only)
router.delete("/:id", auth, deleteReservation);

module.exports = router;
