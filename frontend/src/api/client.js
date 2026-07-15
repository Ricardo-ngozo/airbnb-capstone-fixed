import { sampleListings } from "../data/listings";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const ASSET_URL = API_URL.replace(/\/api\/?$/, "");

export const toAssetUrl = (value) => {
  if (!value) return "";
  if (/^(https?:|data:|blob:)/i.test(value)) return value;
  return `${ASSET_URL}${value.startsWith("/") ? value : `/${value}`}`;
};

/** Shared fetch wrapper — attaches auth token, throws on non-2xx */
const request = async (path, options = {}) => {
  const session = JSON.parse(localStorage.getItem("airbnb_session") || "null");
  const headers = options.body instanceof FormData ? {} : { "Content-Type": "application/json" };
  if (session?.token) headers.Authorization = `Bearer ${session.token}`;

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { ...headers, ...options.headers }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Something went wrong");
  return data;
};

/**
 * Return true if the ID looks like a real Tapline room ID (numeric string)
 * vs a local SA sample ID like "sa-ct-seapoint" or "inmem-ct-camps-bay".
 */
const isTaplineId = (id) => /^\d+$/.test(String(id));

export const api = {
  /** POST /api/users/login */
  login: (credentials) =>
    request("/users/login", { method: "POST", body: JSON.stringify(credentials) }),

  /** POST /api/users/register */
  register: (credentials) =>
    request("/users/register", { method: "POST", body: JSON.stringify(credentials) }),

  /**
   * GET /api/accommodations?location=...
   * Falls back to sampleListings (SA) if the API returns nothing or fails.
   */
  listings: async (location = "") => {
    try {
      const data = await request(
        `/accommodations${location ? `?location=${encodeURIComponent(location)}` : ""}`
      );
      if (Array.isArray(data) && data.length) return data;
    } catch (_e) { /* fall through */ }

    // SA sample data fallback — filter by location
    if (location) {
      const filtered = sampleListings.filter((l) =>
        l.location.toLowerCase().includes(location.toLowerCase())
      );
      return filtered.length ? filtered : sampleListings;
    }
    return sampleListings;
  },

  /**
   * GET /api/accommodations/:id
   * 1. Try backend API first (required for reservations to work)
   * 2. Fall back to sampleListings for offline UI preview
   */
  listing: async (id) => {
    try {
      const data = await request(`/accommodations/${id}`);
      if (data && (data._id || data.room_id)) return data;
    } catch (_e) { /* fall through */ }

    const sample = sampleListings.find((l) => l._id === id || l.id === id);
    return sample || null;
  },

  /** GET /api/accommodations/mine — listings owned by the logged-in host */
  myListings: () => request("/accommodations/mine"),

  /** Tapline proxy endpoints */
  tapline: {
    locations: (q) =>
      request(`/tapline/locations?q=${encodeURIComponent(q)}`),
    search: (body) =>
      request("/tapline/search", { method: "POST", body: JSON.stringify(body) }),
    details: (body) =>
      request("/tapline/details", { method: "POST", body: JSON.stringify(body) }),
    price: (body) =>
      request("/tapline/price", { method: "POST", body: JSON.stringify(body) }),
    calendar: (body) =>
      request("/tapline/calendar", { method: "POST", body: JSON.stringify(body) }),
    reviews: (body) =>
      request("/tapline/reviews", { method: "POST", body: JSON.stringify(body) })
  },

  /** Create or update a listing (multipart FormData for image uploads) */
  saveListing: (id, body) =>
    request(
      id ? `/accommodations/${id}` : "/accommodations",
      { method: id ? "PUT" : "POST", body }
    ),

  deleteListing: (id) =>
    request(`/accommodations/${id}`, { method: "DELETE" }),

  createReservation: (body) =>
    request("/reservations", { method: "POST", body: JSON.stringify(body) }),

  userReservations: () => request("/reservations/user"),
  hostReservations: () => request("/reservations/host"),
  dashboardStats: () => request("/reservations/stats"),
  deleteReservation: (id) =>
    request(`/reservations/${id}`, { method: "DELETE" }),

  /** GET /api/users/profile */
  profile: () => request("/users/profile"),

  /** PUT /api/users/profile — update username / password */
  updateProfile: (body) =>
    request("/users/profile", { method: "PUT", body: JSON.stringify(body) }),

  /** Expose the helper so ListingDetails can use it */
  isTaplineId
};
