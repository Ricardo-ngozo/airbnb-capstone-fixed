/**
 * @module reservationController
 * Handles CRUD operations for reservations (bookings).
 *
 * Business rules:
 *   - A reservation requires at least 1 night between checkIn and checkOut.
 *   - Guest count must be within the accommodation's maximum.
 *   - Total price = (price × nights) - weeklyDiscount (if nights ≥ 7) + fees.
 *   - Only the reservation's guest (user) or the accommodation's host can delete a reservation.
 *
 * Routes (see reservationRoutes.js):
 *   POST   /api/reservations       — create a reservation (auth required)
 *   GET    /api/reservations/host  — get reservations where req.user is the host (auth required)
 *   GET    /api/reservations/user  — get reservations where req.user is the guest (auth required)
 *   DELETE /api/reservations/:id   — cancel / delete a reservation (auth required)
 */

const Accommodation = require("../models/Accommodation");
const Reservation = require("../models/Reservation");

/**
 * POST /api/reservations
 * Creates a new reservation after validating dates, guest count, and
 * calculating the total cost including all fees.
 *
 * @body {string} accommodationId
 * @body {string} checkIn  - ISO date string (YYYY-MM-DD)
 * @body {string} checkOut - ISO date string (YYYY-MM-DD)
 * @body {number} guests
 */
const createReservation = async (req, res, next) => {
  try {
    const { accommodationId, checkIn, checkOut, guests } = req.body;
    const accommodation = global.IN_MEMORY
      ? (global.inMemoryAccommodations || []).find((a) => String(a._id) === String(accommodationId))
      : await Accommodation.findById(accommodationId);
    if (!accommodation) return res.status(404).json({ message: "Accommodation not found" });

    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    if (!checkIn || !checkOut || nights < 1) {
      return res.status(400).json({ message: "Choose a valid check-in and check-out date" });
    }

    if (Number(guests) < 1 || Number(guests) > accommodation.guests) {
      return res.status(400).json({ message: `Guests must be between 1 and ${accommodation.guests}` });
    }

    const subtotal = accommodation.price * nights;
    const weeklyDiscount = nights >= 7 ? accommodation.weeklyDiscount : 0;
    const total =
      subtotal -
      weeklyDiscount +
      Number(accommodation.cleaningFee || 0) +
      Number(accommodation.serviceFee || 0) +
      Number(accommodation.occupancyTaxes || 0);

    if (global.IN_MEMORY) {
      const reservation = {
        _id: `inmem-res-${Date.now()}`,
        accommodation,
        user: req.user,
        host: (global.inMemoryUsers || []).find((user) => String(user._id) === String(accommodation.host_id)) || {
          _id: accommodation.host_id,
          username: accommodation.host
        },
        checkIn,
        checkOut,
        guests: Number(guests),
        nights,
        total,
        status: "confirmed",
        createdAt: new Date().toISOString()
      };
      global.inMemoryReservations.unshift(reservation);
      return res.status(201).json(reservation);
    }

    const reservation = await Reservation.create({
      accommodation: accommodation._id,
      user: req.user._id,
      host: accommodation.host_id,
      checkIn,
      checkOut,
      guests,
      nights,
      total
    });

    res.status(201).json(await reservation.populate("accommodation user host", "title location username email"));
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
};

/**
 * GET /api/reservations/host
 * Returns all reservations for accommodations hosted by the authenticated user.
 */
const getHostReservations = async (req, res, next) => {
  try {
    if (global.IN_MEMORY) {
      const reservations = (global.inMemoryReservations || []).filter((reservation) => {
        const hostId = reservation.host?._id || reservation.host;
        return String(hostId) === String(req.user._id);
      });
      return res.json(reservations);
    }

    const reservations = await Reservation.find({ host: req.user._id })
      .populate("accommodation user", "title location username email")
      .sort({ createdAt: -1 });
    res.json(reservations);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reservations/user
 * Returns all reservations made by the authenticated user (guest view).
 */
const getUserReservations = async (req, res, next) => {
  try {
    if (global.IN_MEMORY) {
      const reservations = (global.inMemoryReservations || []).filter((reservation) => {
        const userId = reservation.user?._id || reservation.user;
        return String(userId) === String(req.user._id);
      });
      return res.json(reservations);
    }

    const reservations = await Reservation.find({ user: req.user._id })
      .populate("accommodation host", "title location username email")
      .sort({ createdAt: -1 });
    res.json(reservations);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/reservations/:id
 * Cancels (deletes) a reservation. Only the reservation's guest or the
 * accommodation's host may perform this action.
 */
const deleteReservation = async (req, res, next) => {
  try {
    if (global.IN_MEMORY) {
      const before = (global.inMemoryReservations || []).length;
      global.inMemoryReservations = (global.inMemoryReservations || []).filter((reservation) => {
        const owner = String(reservation.user?._id || reservation.user) === String(req.user._id);
        const host = String(reservation.host?._id || reservation.host) === String(req.user._id);
        return String(reservation._id) !== String(req.params.id) || (!owner && !host);
      });
      if (global.inMemoryReservations.length === before) {
        return res.status(404).json({ message: "Reservation not found" });
      }
      return res.json({ message: "Reservation deleted" });
    }

    const reservation = await Reservation.findOneAndDelete({
      _id: req.params.id,
      $or: [{ user: req.user._id }, { host: req.user._id }]
    });
    if (!reservation) return res.status(404).json({ message: "Reservation not found" });
    res.json({ message: "Reservation deleted" });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reservations/stats
 * Returns dashboard summary counts for the authenticated user.
 */
const getDashboardStats = async (req, res, next) => {
  try {
    if (global.IN_MEMORY) {
      const myListings = (global.inMemoryAccommodations || []).filter(
        (a) => String(a.host_id) === String(req.user._id)
      );
      const hostReservations = (global.inMemoryReservations || []).filter((reservation) => {
        const hostId = reservation.host?._id || reservation.host;
        return String(hostId) === String(req.user._id) && reservation.status !== "cancelled";
      });
      const guestReservations = (global.inMemoryReservations || []).filter((reservation) => {
        const userId = reservation.user?._id || reservation.user;
        return String(userId) === String(req.user._id) && reservation.status !== "cancelled";
      });

      return res.json({
        listings: myListings.length,
        hostReservations: hostReservations.length,
        guestReservations: guestReservations.length,
        revenue: hostReservations.reduce((sum, reservation) => sum + Number(reservation.total || 0), 0)
      });
    }

    const listings = await Accommodation.countDocuments({ host_id: req.user._id });
    const hostReservations = await Reservation.find({ host: req.user._id, status: { $ne: "cancelled" } });
    const guestReservations = await Reservation.countDocuments({
      user: req.user._id,
      status: { $ne: "cancelled" }
    });

    res.json({
      listings,
      hostReservations: hostReservations.length,
      guestReservations,
      revenue: hostReservations.reduce((sum, reservation) => sum + Number(reservation.total || 0), 0)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reservations/availability/:accommodationId
 * Returns an array of booked date ranges for a specific accommodation.
 * Used by the frontend date picker to block out unavailable dates.
 */
const getAvailability = async (req, res, next) => {
  try {
    const { accommodationId } = req.params;
    let reservations = [];

    if (global.IN_MEMORY) {
      reservations = (global.inMemoryReservations || []).filter((r) => {
        const accId = r.accommodation?._id || r.accommodation;
        return String(accId) === String(accommodationId) && r.status !== "cancelled";
      });
    } else {
      reservations = await Reservation.find({
        accommodation: accommodationId,
        status: { $ne: "cancelled" }
      }).select("checkIn checkOut -_id");
    }

    const bookedRanges = reservations.map((r) => ({
      checkIn:  r.checkIn,
      checkOut: r.checkOut
    }));

    res.json(bookedRanges);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReservation,
  getHostReservations,
  getUserReservations,
  deleteReservation,
  getDashboardStats,
  getAvailability
};
