/**
 * @module taplineService
 * Wrapper around the Tapline Airbnb Data API (https://tapline.sh).
 *
 * Authentication: X-API-Key header using TAPLINE_API_KEY env var.
 * Base URL:       TAPLINE_BASE_URL env var (default: https://api.tapline.sh)
 *
 * Endpoint summary:
 *   GET  /api/v1/airbnb/locations?query=<q>   — location autocomplete (1 credit)
 *   POST /api/v1/airbnb/search                — search listings (5 credits)
 *   POST /api/v1/airbnb/details               — single listing detail (5 credits)
 *   POST /api/v1/airbnb/price                 — pricing info (3 credits)
 *   POST /api/v1/airbnb/calendar              — availability calendar (1 credit)
 *   POST /api/v1/airbnb/reviews               — listing reviews (3 credits)
 *
 * Search body shape (confirmed working):
 *   { query, adults?, check_in?, check_out?, cursor?, ne_lat?, ne_long?, sw_lat?, sw_long? }
 *
 * Response listing shape:
 *   { room_id, url, name, title, coordinates, price: { amount, formatted, currency, nights },
 *     rating, review_count, images: [url, ...], ... }
 */

const TAPLINE_BASE = (process.env.TAPLINE_BASE_URL || "https://api.tapline.sh").replace(/\/$/, "");
const TAPLINE_KEY  = process.env.TAPLINE_API_KEY;

if (!TAPLINE_KEY) {
  console.warn("⚠  TAPLINE_API_KEY not set — external listing data will be unavailable.");
}

/**
 * Internal fetch helper. All Tapline requests go through here.
 * @param {string} path    - e.g. "/api/v1/airbnb/search"
 * @param {string} method  - "GET" | "POST"
 * @param {object|null} body - JSON body for POST requests
 * @param {string} qs      - query-string suffix for GET requests (e.g. "?query=Paris")
 */
async function callTapline(path, method = "GET", body = null, qs = "") {
  const url = `${TAPLINE_BASE}${path}${qs}`;
  const opts = {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": TAPLINE_KEY
    }
  };
  if (body) opts.body = JSON.stringify(body);

  const res  = await fetch(url, opts);
  const text = await res.text();

  let parsed;
  try   { parsed = JSON.parse(text); }
  catch { return text; }

  // Surface API-level errors so callers can handle them
  if (!res.ok) {
    const msg = parsed?.message || `Tapline ${res.status}`;
    throw new Error(msg);
  }

  return parsed;
}

module.exports = {
  /**
   * Location autocomplete — returns place suggestions for a partial name.
   * Uses "query" param (not "q").
   * @param {string} q - partial location string e.g. "Par"
   */
  locations: (q) =>
    callTapline("/api/v1/airbnb/locations", "GET", null, q ? `?query=${encodeURIComponent(q)}` : ""),

  /**
   * Search listings by location query string.
   * Body must include "query" (free-text location). Optional: adults, check_in, check_out, cursor.
   * @param {object} body - { query, adults?, check_in?, check_out?, cursor? }
   * @returns {{ listings: Array, cursor?: string }}
   */
  search: (body) => callTapline("/api/v1/airbnb/search", "POST", body),

  /**
   * Get details for a single listing.
   * @param {object} body - { room_id } or { listing_id } or { id }
   */
  details: (body) => callTapline("/api/v1/airbnb/details", "POST", body),

  /**
   * Get pricing information for a listing.
   * @param {object} body - { room_id, check_in, check_out, adults }
   */
  price: (body) => callTapline("/api/v1/airbnb/price", "POST", body),

  /**
   * Get availability calendar for a listing.
   * @param {object} body - { room_id, month?, year? }
   */
  calendar: (body) => callTapline("/api/v1/airbnb/calendar", "POST", body),

  /**
   * Get reviews for a listing.
   * @param {object} body - { room_id }
   */
  reviews: (body) => callTapline("/api/v1/airbnb/reviews", "POST", body)
};
