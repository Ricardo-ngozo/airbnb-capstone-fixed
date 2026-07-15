/**
 * @module accommodationController
 * Handles CRUD operations for accommodation listings.
 *
 * Data strategy (in order of priority):
 *   1. External Tapline API — when TAPLINE_BASE_URL env var is set
 *   2. In-memory store     — when MongoDB is unavailable (global.IN_MEMORY)
 *   3. MongoDB via Mongoose — production default
 *
 * Routes (see accommodationRoutes.js):
 *   GET    /api/accommodations        — list accommodations (optional ?location= filter)
 *   GET    /api/accommodations/:id    — get a single accommodation
 *   POST   /api/accommodations        — create a new accommodation (auth required)
 *   PUT    /api/accommodations/:id    — update an accommodation (auth required)
 *   DELETE /api/accommodations/:id    — delete an accommodation (auth required)
 */

const Accommodation = require("../models/Accommodation");
const tapline = require("../services/taplineService");

/**
 * Parse an amenities value that may arrive as an array or a comma-separated string.
 * @param {string|string[]} amenities
 * @returns {string[]}
 */
const parseAmenities = (amenities) => {
  if (Array.isArray(amenities)) return amenities;
  if (!amenities) return [];
  return String(amenities)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

/**
 * Build the accommodation payload from request body, authenticated user, and
 * any uploaded files (via multer). Uploaded image paths take precedence over
 * URL strings supplied in the body.
 *
 * @param {object} body    - req.body
 * @param {object} user    - req.user (from auth middleware)
 * @param {Array}  files   - req.files (from multer, may be empty)
 * @returns {object} merged payload ready for Mongoose or the in-memory store
 */
const accommodationPayload = (body, user, files = []) => {
  const uploadedImages = files.map((file) => `/uploads/${file.filename}`);
  const bodyImages = Array.isArray(body.images)
    ? body.images
    : String(body.images || "")
        .split(",")
        .map((image) => image.trim())
        .filter(Boolean);

  return {
    ...body,
    amenities: parseAmenities(body.amenities),
    images: uploadedImages.length ? uploadedImages : bodyImages,
    host: body.host || user.username,
    host_id: user._id
  };
};

/**
 * GET /api/accommodations
 * Returns a list of accommodations, optionally filtered by ?location= query param.
 * Tries Tapline API → in-memory store → MongoDB in that order.
 */
const getAccommodations = async (req, res, next) => {
  try {
    const location = req.query.location || "";

    // If a TAPLINE_BASE_URL is configured, proxy the request to the external
    // Tapline Airbnb Data API (or any external provider). This allows the
    // frontend to surface many more listings. The full query string is
    // forwarded; if TAPLINE_API_KEY is set it will be added as a Bearer token.
    if (process.env.TAPLINE_BASE_URL) {
      try {
        // Tapline search requires "query" (not "location") as the free-text location field.
        // Response shape: { listings: [ { room_id, name, title, rating, review_count,
        //   price: { amount, currency }, images: [...], coordinates: { latitude, longitude } } ] }
        const searchBody = { query: location || "Bordeaux" };
        const resp = await tapline.search(searchBody);
        const items = Array.isArray(resp) ? resp : resp?.listings || resp?.results || resp?.data || [];
        if (items && items.length) {
          // Normalise Tapline shape → our internal accommodation shape
          const mapped = items.map((it) => ({
            _id:          it.room_id || it.id || it._id,
            title:        it.name   || it.title || "Listing",
            type:         it.room_type || it.type || "Entire place",
            location:     it.city   || it.location || location,
            description:  it.description || it.summary || "",
            host:         (it.host && (it.host.name || it.host)) || it.host_name || "Host",
            host_id:      (it.host && it.host.id) || it.host_id || null,
            guests:       it.max_guests  || it.guests || 2,
            bedrooms:     it.bedrooms    || it.bedroom_count || 1,
            bathrooms:    it.bathrooms   || it.bathroom_count || 1,
            amenities:    it.amenities   || it.features || [],
            images:       it.images      || it.photos || [],
            rating:       it.rating      || it.review_score || 0,
            reviews:      it.review_count || it.reviews || 0,
            price:        (it.price && (it.price.amount || it.price)) || it.nightly_price || 0,
            weeklyDiscount: it.weeklyDiscount || 0,
            cleaningFee:    it.cleaningFee   || 0,
            serviceFee:     it.serviceFee    || 0,
            occupancyTaxes: it.occupancyTaxes || 0,
            url:          it.url || null
          }));
          return res.json(mapped);
        }
      } catch (err) {
        console.warn("Tapline proxy failed:", err.message || err);
      }
    }

    if (global.IN_MEMORY) {
      const list = (global.inMemoryAccommodations || []).filter((a) =>
        location ? new RegExp(location, "i").test(a.location) : true
      );
      return res.json(list);
    }

    const query = req.query.location ? { location: new RegExp(req.query.location, "i") } : {};
    const accommodations = await Accommodation.find(query).sort({ createdAt: -1 });
    res.json(accommodations);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/accommodations/mine
 * Returns accommodations owned by the authenticated host.
 */
const getMyAccommodations = async (req, res, next) => {
  try {
    if (global.IN_MEMORY) {
      const list = (global.inMemoryAccommodations || []).filter(
        (a) => String(a.host_id) === String(req.user._id)
      );
      return res.json(list);
    }

    const accommodations = await Accommodation.find({ host_id: req.user._id }).sort({ createdAt: -1 });
    res.json(accommodations);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/accommodations/:id
 * Returns a single accommodation by its ID.
 * Tries Tapline API → in-memory store → MongoDB in that order.
 */
const getAccommodation = async (req, res, next) => {
  try {
    // If external Tapline API is configured, try fetching a single listing
    if (process.env.TAPLINE_BASE_URL) {
      try {
        // Tapline details endpoint needs room_id
        const resp = await tapline.details({ room_id: req.params.id, listing_id: req.params.id });
        const src = Array.isArray(resp) ? resp[0] : resp;
        if (src && Object.keys(src).length && !src.code) {
          // Normalise to our shape
          const mapped = {
            _id:          src.room_id || src.id || req.params.id,
            title:        src.name    || src.title || "Listing",
            type:         src.room_type || src.type || "Entire place",
            location:     src.city    || src.location || "",
            description:  src.description || src.summary || "",
            host:         (src.host && (src.host.name || src.host)) || src.host_name || "Host",
            host_id:      (src.host && src.host.id) || src.host_id || null,
            guests:       src.max_guests  || src.guests || 2,
            bedrooms:     src.bedrooms    || src.bedroom_count || 1,
            bathrooms:    src.bathrooms   || src.bathroom_count || 1,
            amenities:    src.amenities   || src.features || [],
            images:       src.images      || src.photos || [],
            rating:       src.rating      || src.review_score || 0,
            reviews:      src.review_count || src.reviews || 0,
            price:        (src.price && (src.price.amount || src.price)) || src.nightly_price || 0,
            weeklyDiscount: src.weeklyDiscount || 0,
            cleaningFee:    src.cleaningFee   || 0,
            serviceFee:     src.serviceFee    || 0,
            occupancyTaxes: src.occupancyTaxes || 0,
            specificRatings: src.specific_ratings || src.specificRatings || {},
            enhancedCleaning: src.enhancedCleaning ?? true,
            selfCheckIn:      src.selfCheckIn ?? true,
            url:          src.url || null
          };
          return res.json(mapped);
        }
      } catch (err) {
        console.warn("Tapline single listing fetch failed:", err.message || err);
      }
    }

    if (global.IN_MEMORY) {
      const acc = (global.inMemoryAccommodations || []).find((a) => String(a._id) === String(req.params.id));
      if (!acc) return res.status(404).json({ message: "Accommodation not found" });
      return res.json(acc);
    }

    const accommodation = await Accommodation.findById(req.params.id);
    if (!accommodation) return res.status(404).json({ message: "Accommodation not found" });
    res.json(accommodation);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/accommodations
 * Creates a new accommodation listing. Requires authentication.
 * Accepts multipart/form-data for image file uploads (field name: "images").
 *
 * @body {string} title, type, location, description, host
 * @body {number} guests, bedrooms, bathrooms, price, weeklyDiscount, cleaningFee, serviceFee, occupancyTaxes
 * @body {string} amenities - comma-separated or JSON array
 * @body {string} images    - comma-separated image URLs (used when no files are uploaded)
 * @body {boolean} enhancedCleaning, selfCheckIn
 */
const createAccommodation = async (req, res, next) => {
  try {
    const payload = accommodationPayload(req.body, req.user, req.files);
    if (global.IN_MEMORY) {
      const accommodation = {
        _id: `inmem-${Date.now()}`,
        ...payload,
        guests: Number(payload.guests),
        bedrooms: Number(payload.bedrooms),
        bathrooms: Number(payload.bathrooms),
        price: Number(payload.price),
        weeklyDiscount: Number(payload.weeklyDiscount || 0),
        cleaningFee: Number(payload.cleaningFee || 0),
        serviceFee: Number(payload.serviceFee || 0),
        occupancyTaxes: Number(payload.occupancyTaxes || 0),
        rating: Number(payload.rating || 4.5),
        reviews: Number(payload.reviews || 0),
        enhancedCleaning: payload.enhancedCleaning === "true" || payload.enhancedCleaning === true,
        selfCheckIn: payload.selfCheckIn === "true" || payload.selfCheckIn === true,
        specificRatings: {
          cleanliness: 4.8,
          communication: 4.7,
          checkIn: 4.9,
          accuracy: 4.6,
          location: 4.9,
          value: 4.5
        },
        createdAt: new Date().toISOString()
      };
      global.inMemoryAccommodations.unshift(accommodation);
      return res.status(201).json(accommodation);
    }

    const accommodation = await Accommodation.create(payload);
    res.status(201).json(accommodation);
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
};

/**
 * PUT /api/accommodations/:id
 * Updates an existing accommodation. Requires authentication.
 * Accepts multipart/form-data; uploaded images replace existing ones only when
 * new files are provided.
 */
const ownsAccommodation = (accommodation, user) =>
  String(accommodation.host_id) === String(user._id) || user.role === "admin";

const updateAccommodation = async (req, res, next) => {
  try {
    const payload = accommodationPayload(req.body, req.user, req.files);
    if (global.IN_MEMORY) {
      const index = (global.inMemoryAccommodations || []).findIndex((a) => String(a._id) === String(req.params.id));
      if (index === -1) return res.status(404).json({ message: "Accommodation not found" });

      const current = global.inMemoryAccommodations[index];
      if (!ownsAccommodation(current, req.user)) {
        return res.status(403).json({ message: "You can only update your own listings" });
      }
      const updated = {
        ...current,
        ...payload,
        images: payload.images.length ? payload.images : current.images,
        guests: Number(payload.guests || current.guests),
        bedrooms: Number(payload.bedrooms || current.bedrooms),
        bathrooms: Number(payload.bathrooms || current.bathrooms),
        price: Number(payload.price || current.price),
        weeklyDiscount: Number(payload.weeklyDiscount || 0),
        cleaningFee: Number(payload.cleaningFee || 0),
        serviceFee: Number(payload.serviceFee || 0),
        occupancyTaxes: Number(payload.occupancyTaxes || 0),
        enhancedCleaning: payload.enhancedCleaning === "true" || payload.enhancedCleaning === true,
        selfCheckIn: payload.selfCheckIn === "true" || payload.selfCheckIn === true,
        updatedAt: new Date().toISOString()
      };
      global.inMemoryAccommodations[index] = updated;
      return res.json(updated);
    }

    const existing = await Accommodation.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Accommodation not found" });
    if (!ownsAccommodation(existing, req.user)) {
      return res.status(403).json({ message: "You can only update your own listings" });
    }

    const accommodation = await Accommodation.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true
    });
    res.json(accommodation);
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
};

/**
 * DELETE /api/accommodations/:id
 * Deletes an accommodation by ID. Requires authentication.
 * In in-memory mode, also cascades deletion of associated reservations.
 */
const deleteAccommodation = async (req, res, next) => {
  try {
    if (global.IN_MEMORY) {
      const target = (global.inMemoryAccommodations || []).find((a) => String(a._id) === String(req.params.id));
      if (!target) return res.status(404).json({ message: "Accommodation not found" });
      if (!ownsAccommodation(target, req.user)) {
        return res.status(403).json({ message: "You can only delete your own listings" });
      }

      const before = (global.inMemoryAccommodations || []).length;
      global.inMemoryAccommodations = (global.inMemoryAccommodations || []).filter(
        (a) => String(a._id) !== String(req.params.id)
      );
      if (global.inMemoryAccommodations.length === before) {
        return res.status(404).json({ message: "Accommodation not found" });
      }
      global.inMemoryReservations = (global.inMemoryReservations || []).filter(
        (reservation) => String(reservation.accommodation?._id || reservation.accommodation) !== String(req.params.id)
      );
      return res.json({ message: "Accommodation deleted" });
    }

    const accommodation = await Accommodation.findById(req.params.id);
    if (!accommodation) return res.status(404).json({ message: "Accommodation not found" });
    if (!ownsAccommodation(accommodation, req.user)) {
      return res.status(403).json({ message: "You can only delete your own listings" });
    }

    await Accommodation.findByIdAndDelete(req.params.id);
    res.json({ message: "Accommodation deleted" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAccommodations,
  getMyAccommodations,
  getAccommodation,
  createAccommodation,
  updateAccommodation,
  deleteAccommodation
};
