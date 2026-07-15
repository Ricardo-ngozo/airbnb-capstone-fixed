import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Heart, Star } from "lucide-react";
import { api, toAssetUrl } from "../api/client";
import { zarFmt, toZAR } from "../utils/currency";
import { Footer } from "./Home";
import { LeafletMap, SA_MAP_POINTS } from "../components/LeafletMap";

const SA_LOCATIONS = Object.keys(SA_MAP_POINTS);

const FILTER_CHIPS = [
  { label: "Free cancellation", key: "freeCancellation" },
  { label: "Type of place",     key: "type" },
  { label: "Price: Low→High",   key: "priceLow" },
  { label: "Price: High→Low",   key: "priceHigh" },
  { label: "Top rated",         key: "topRated" }
];

const normalizeAmenities = (items) => {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") return item.name || item.title || item.label || item.category;
      return "";
    })
    .filter(Boolean);
};

const normalizeImages = (items) => {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => {
      if (typeof item === "string") return toAssetUrl(item);
      if (item && typeof item === "object") {
        return toAssetUrl(
          item.url || item.picture_url || item.medium_url || item.large_url || item.thumbnail_url
        );
      }
      return "";
    })
    .filter(Boolean);
};

const normalizeText = (value, fallback = "") => {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    return value.name || value.title || value.label || value.city || value.localized || fallback;
  }
  return value || fallback;
};

function mapItem(it, i, fallbackLocation) {
  const rawPrice =
    (it.price && (it.price.amount || it.price)) ||
    it.nightly_price ||
    it.price_per_night ||
    0;
  const priceZAR = rawPrice > 500 ? rawPrice : toZAR(rawPrice);

  return {
    _id:      it.room_id || it.id || it._id || it.listing_id || `tap-${i}`,
    title:    it.name    || it.title || it.summary || "Listing",
    type:     it.room_type || it.type || "Entire place",
    location: normalizeText(it.city || it.location || it.neighborhood, fallbackLocation),
    description: it.description || it.summary || "",
    host:     (it.host && (it.host.name || it.host)) || it.host_name || "Host",
    host_id:  it.host_id || (it.host && it.host.id) || null,
    guests:   it.max_guests || it.max_guest_capacity || it.guests || 1,
    bedrooms: it.bedrooms   || it.bedroom_count || 1,
    bathrooms: it.bathrooms || it.baths || it.bathroom_count || 1,
    amenities: normalizeAmenities(it.amenities || it.features || []),
    images:   normalizeImages(it.images || it.photos || []),
    rating:   it.rating     || it.review_score || 0,
    reviews:  it.review_count || it.reviews || 0,
    price:    priceZAR,
    weeklyDiscount: toZAR(it.weeklyDiscount || 0),
    cleaningFee:    toZAR(it.cleaningFee    || 0),
    serviceFee:     toZAR(it.serviceFee     || 0),
    occupancyTaxes: toZAR(it.occupancyTaxes || 0)
  };
}

const formatDate = (date) => new Date(date).toISOString().slice(0, 10);

const buildUnavailableDates = (listing, offset = 0) => {
  const dates = new Set();
  const base = new Date();
  const seed = (listing.location?.length || 0) + (listing.price || 0);
  for (let i = 1; i <= 12; i += 1) {
    const date = new Date(base);
    date.setDate(base.getDate() + ((seed + i * 5 + offset) % 18) + 2);
    dates.add(formatDate(date));
  }
  return dates;
};

// Wishlist helpers backed by localStorage
const loadWishlist = () => {
  try { return new Set(JSON.parse(localStorage.getItem("airbnb_wishlist") || "[]")); }
  catch { return new Set(); }
};
const saveWishlist = (set) => {
  localStorage.setItem("airbnb_wishlist", JSON.stringify([...set]));
};

export function Locations() {
  const [params, setParams]     = useSearchParams();
  const [listings, setListings] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [activeChip, setActiveChip] = useState("");
  const [wishlist, setWishlist] = useState(loadWishlist);

  const location = params.get("location") || "Cape Town";
  const checkIn  = params.get("checkIn")  || "";
  const checkOut = params.get("checkOut") || "";
  const guests   = Number(params.get("guests") || "2");

  /* ── fetch listings ───────────────────────────────────────── */
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setListings([]);

    (async () => {
      try {
        const resp  = await api.tapline.search({ query: location });
        const items = Array.isArray(resp) ? resp : resp?.listings || resp?.results || [];
        if (items && items.length) {
          const mapped = items.map((it, i) => mapItem(it, i, location));
          if (mounted) { setListings(mapped); setLoading(false); return; }
        }
      } catch (_e) { /* fall through */ }

      if (mounted) {
        try {
          const local = await api.listings(location);
          if (mounted) setListings(local || []);
        } catch (_e) {
          if (mounted) setListings([]);
        } finally {
          if (mounted) setLoading(false);
        }
      }
    })();

    return () => { mounted = false; };
  }, [location]);

  /* ── toggle wishlist ──────────────────────────────────────── */
  const toggleWishlist = (e, id) => {
    e.preventDefault();
    setWishlist((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      saveWishlist(next);
      return next;
    });
  };

  /* ── filtered + sorted listings ──────────────────────────── */
  const activeListings = useMemo(() => {
    let result = listings.filter((listing) => {
      if (listing.guests < guests) return false;
      if (!checkIn || !checkOut) return true;

      const start   = new Date(checkIn);
      const end     = new Date(checkOut);
      const blocked = buildUnavailableDates(listing, listing.price % 7);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return true;
      if (end <= start) return true;

      const cursor = new Date(start);
      while (cursor < end) {
        if (blocked.has(formatDate(cursor))) return false;
        cursor.setDate(cursor.getDate() + 1);
      }
      return true;
    });

    // Apply chip filter
    if (activeChip === "freeCancellation") {
      // Show all — free cancellation is offered on all listings in this app
    } else if (activeChip === "type") {
      result = result.filter((l) => (l.type || "").toLowerCase().includes("entire"));
    } else if (activeChip === "priceLow") {
      result = [...result].sort((a, b) => a.price - b.price);
    } else if (activeChip === "priceHigh") {
      result = [...result].sort((a, b) => b.price - a.price);
    } else if (activeChip === "topRated") {
      result = [...result].sort((a, b) => b.rating - a.rating);
    }

    return result;
  }, [checkIn, checkOut, guests, listings, activeChip]);

  const countLabel = useMemo(
    () => `${activeListings.length || "200+"} stays in ${location}`,
    [activeListings.length, location]
  );

  const selectedMapLocation = SA_MAP_POINTS[location] ? location : "Cape Town";

  return (
    <div className="page narrow listing-page">

      {/* ── filter row ── */}
      <div className="filter-row">
        <label>
          Location
          <select
            value={location}
            onChange={(e) => {
              const next = new URLSearchParams(params);
              next.set("location", e.target.value);
              setParams(next);
            }}
            aria-label="Filter by location"
          >
            {SA_LOCATIONS.map((loc) => <option key={loc}>{loc}</option>)}
          </select>
        </label>

        <label>
          Check-in
          <input
            type="date"
            value={checkIn}
            onChange={(e) => {
              const next = new URLSearchParams(params);
              next.set("checkIn", e.target.value);
              setParams(next);
            }}
            aria-label="Set check-in date"
          />
        </label>

        <label>
          Check-out
          <input
            type="date"
            min={checkIn || undefined}
            value={checkOut}
            onChange={(e) => {
              const next = new URLSearchParams(params);
              next.set("checkOut", e.target.value);
              setParams(next);
            }}
            aria-label="Set check-out date"
          />
        </label>

        <label>
          Guests
          <select
            value={guests}
            onChange={(e) => {
              const next = new URLSearchParams(params);
              next.set("guests", e.target.value);
              setParams(next);
            }}
            aria-label="Select guest count"
          >
            {[1, 2, 3, 4, 5, 6, 8, 10].map((count) => (
              <option key={count} value={count}>{count} guest{count > 1 ? "s" : ""}</option>
            ))}
          </select>
        </label>

        <div className="filter-chips" role="group" aria-label="Filter options">
          {FILTER_CHIPS.map((chip) => (
            <button
              key={chip.key}
              className={activeChip === chip.key ? "active" : ""}
              onClick={() => setActiveChip((c) => (c === chip.key ? "" : chip.key))}
              aria-pressed={activeChip === chip.key}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      <div className="locations-topbar">
        <h1>{loading ? `Searching ${location}…` : countLabel}</h1>
        {(checkIn || checkOut) && (
          <div className="search-summary">
            {checkIn  && <span>Check-in: {checkIn}</span>}
            {checkOut && <span>Check-out: {checkOut}</span>}
            <span>{guests} guest{guests !== 1 ? "s" : ""}</span>
          </div>
        )}
      </div>

      {/* ── Live Leaflet map ── */}
      <LeafletMap
        selected={selectedMapLocation}
        listings={activeListings}
        onSelect={(nextLocation) => {
          const next = new URLSearchParams(params);
          next.set("location", nextLocation);
          setParams(next);
        }}
      />

      {/* ── listing cards ── */}
      <div className="listing-list">
        {activeListings.map((listing) => (
          <Link
            className="listing-card"
            key={listing._id}
            to={`/locations/${listing._id}`}
          >
            <img
              src={
                listing.images?.[0] ||
                "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?auto=format&fit=crop&w=600&q=80"
              }
              alt={listing.title}
              loading="lazy"
            />
            <div>
              <p>{listing.type} in {listing.location}</p>
              <h2>{listing.title}</h2>
              <span>
                {listing.guests} guests &nbsp;·&nbsp;
                {listing.bedrooms} bed{listing.bedrooms !== 1 ? "s" : ""} &nbsp;·&nbsp;
                {listing.bathrooms} bath{listing.bathrooms !== 1 ? "s" : ""}
              </span>
              {Array.isArray(listing.amenities) && listing.amenities.length > 0 && (
                <span>{listing.amenities.slice(0, 4).join(" · ")}</span>
              )}
              <strong>
                <Star size={14} fill="currentColor" /> {listing.rating}
                <span style={{ color: "var(--muted)", fontWeight: 400 }}>
                  &nbsp;({listing.reviews} reviews)
                </span>
              </strong>
              <b>{zarFmt(listing.price)} <small>/night</small></b>
            </div>
            <button
              className={`save-button${wishlist.has(listing._id) ? " saved" : ""}`}
              title={wishlist.has(listing._id) ? "Remove from wishlist" : "Save to wishlist"}
              onClick={(e) => toggleWishlist(e, listing._id)}
              aria-label={`${wishlist.has(listing._id) ? "Remove" : "Save"} ${listing.title}`}
            >
              <Heart size={18} fill={wishlist.has(listing._id) ? "#ff385c" : "none"} color={wishlist.has(listing._id) ? "#ff385c" : "currentColor"} />
            </button>
          </Link>
        ))}

        {!loading && activeListings.length === 0 && (
          <p style={{ color: "var(--muted)", padding: "32px 0" }}>
            No listings found for <strong>{location}</strong> with the current filters.
            <br />
            Try another location, date range, or guest count.
          </p>
        )}
      </div>

      <Footer />
    </div>
  );
}
