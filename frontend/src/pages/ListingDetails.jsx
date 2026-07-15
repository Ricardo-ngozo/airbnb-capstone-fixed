import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Award, Calendar, Heart, Home, Share2, Sparkles, Star, Wifi } from "lucide-react";
import { api, toAssetUrl } from "../api/client";
import { useAuth } from "../auth";
import { zarFmt, toZAR } from "../utils/currency";
import { Footer } from "./Home";

const today = new Date().toISOString().slice(0, 10);

function LuxuryHomeMark() {
  return (
    <svg className="listing-luxury-mark" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <path d="M9 31 32 12l23 19" />
      <path d="M14 28v21h36V28" />
      <path d="M27 49V35h10v14" />
      <path d="M18 20h28" />
      <circle cx="32" cy="28" r="2.8" />
    </svg>
  );
}

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
        return toAssetUrl(item.url || item.picture_url || item.medium_url || item.large_url || item.thumbnail_url);
      }
      return "";
    })
    .filter(Boolean);
};

/** Normalise any API response shape into our internal listing object */
function mapListing(src, fallbackId) {
  const rawPrice =
    (src.price && (src.price.amount || src.price)) ||
    src.price_per_night ||
    src.nightly_price ||
    0;
  const priceZAR = rawPrice > 500 ? rawPrice : toZAR(rawPrice);

  return {
    _id:       src.room_id || src.id || src._id || fallbackId,
    title:     src.name    || src.title || src.summary || "Listing",
    type:      src.room_type || src.type || "Entire place",
    location:  src.city    || src.location || src.neighborhood || "South Africa",
    country:   src.country || "South Africa",
    description: src.description || src.summary || "",
    host:      (src.host && (src.host.name || src.host)) || src.host_name || "Host",
    host_id:   src.host_id || (src.host && src.host.id) || null,
    guests:    src.max_guests || src.max_guest_capacity || src.guests || 1,
    bedrooms:  src.bedrooms  || src.bedroom_count || 1,
    bathrooms: src.bathrooms || src.bathroom_count || 1,
    amenities: normalizeAmenities(src.amenities || src.features || []),
    images:    normalizeImages(src.images || src.photos || []),
    rating:    src.rating    || src.review_score || 0,
    reviews:   src.review_count || src.reviews || 0,
    price:     priceZAR,
    weeklyDiscount: src.weeklyDiscount > 500 ? src.weeklyDiscount : toZAR(src.weeklyDiscount || 0),
    cleaningFee:    src.cleaningFee    > 500 ? src.cleaningFee    : toZAR(src.cleaningFee    || 0),
    serviceFee:     src.serviceFee     > 500 ? src.serviceFee     : toZAR(src.serviceFee     || 0),
    occupancyTaxes: src.occupancyTaxes > 200 ? src.occupancyTaxes : toZAR(src.occupancyTaxes || 0),
    enhancedCleaning: src.enhancedCleaning ?? true,
    selfCheckIn:      src.selfCheckIn      ?? true,
    specificRatings:  src.specific_ratings  || src.specificRatings || {}
  };
}

export function ListingDetails() {
  const { id }           = useParams();
  const { session }      = useAuth();
  const navigate         = useNavigate();
  const [listing,  setListing]  = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [form,     setForm]     = useState({ checkIn: today, checkOut: "", guests: 1 });
  const [message,  setMessage]  = useState({ text: "", type: "" });

  // ── fetch listing ──────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    setListing(null);
    setNotFound(false);

    (async () => {
      // 1. For numeric IDs (Tapline real listings) try Tapline details
      if (api.isTaplineId(id)) {
        try {
          const resp = await api.tapline.details({ room_id: id });
          const src  = Array.isArray(resp) ? resp[0] : resp;
          if (src && !src.code && !src.error && Object.keys(src).length > 1) {
            if (mounted) return setListing(mapListing(src, id));
          }
        } catch (_e) { /* fall through */ }
      }

      // 2. Local lookup: sampleListings + in-memory / MongoDB
      try {
        const local = await api.listing(id);
        if (local && (local._id || local.room_id)) {
          if (mounted) return setListing(mapListing(local, id));
        }
      } catch (_e) { /* fall through */ }

      // 3. Nothing found
      if (mounted) setNotFound(true);
    })();

    return () => { mounted = false; };
  }, [id]);

  // ── cost calculator ────────────────────────────────────────
  const calc = useMemo(() => {
    if (!listing || !form.checkOut) {
      return { nights: 0, subtotal: 0, discount: 0, total: 0 };
    }
    const start  = new Date(form.checkIn);
    const end    = new Date(form.checkOut);
    const nights = Math.max(0, Math.ceil((end - start) / 86400000));
    const subtotal = nights * listing.price;
    const discount = nights >= 7 ? (listing.weeklyDiscount || 0) : 0;
    const total    = subtotal - discount +
      (listing.cleaningFee    || 0) +
      (listing.serviceFee     || 0) +
      (listing.occupancyTaxes || 0);
    return { nights, subtotal, discount, total };
  }, [form.checkIn, form.checkOut, listing]);

  // ── reserve ────────────────────────────────────────────────
  const reserve = async () => {
    if (!session) return navigate("/login", { state: { from: `/locations/${id}` } });
    if (!form.checkIn || !form.checkOut || calc.nights < 1) {
      return setMessage({ text: "Please choose valid check-in and check-out dates.", type: "error" });
    }
    try {
      await api.createReservation({ accommodationId: listing._id, ...form });
      setMessage({ text: "🎉 Reservation confirmed! View it under Reservations.", type: "feedback" });
    } catch (err) {
      setMessage({ text: err.message, type: "error" });
    }
  };

  // ── render guards ──────────────────────────────────────────
  if (notFound) {
    return (
      <div className="page narrow" style={{ paddingTop: 60, textAlign: "center" }}>
        <LuxuryHomeMark />
        <h2>Listing not found</h2>
        <p style={{ color: "var(--muted)" }}>
          This listing may have been removed or the link is incorrect.
        </p>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="page narrow" style={{ paddingTop: 60, textAlign: "center" }}>
        <p style={{ color: "var(--muted)", fontSize: 16 }}>Loading listing…</p>
      </div>
    );
  }

  const locationLabel = [listing.location, listing.country]
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i) // deduplicate
    .join(", ");

  const amenityList =
    Array.isArray(listing.amenities) && listing.amenities.length
      ? listing.amenities
      : ["Wifi", "Kitchen", "Braai", "Free Parking", "Air Conditioning", "Washer"];

  return (
    <div className="page narrow details-page">

      {/* ── heading ── */}
      <section className="details-head">
        <h1>{listing.title}</h1>
        <div className="details-meta">
          <p>
            <Star size={13} fill="currentColor" />
            &nbsp;{listing.rating}&nbsp;·&nbsp;
            {listing.reviews} reviews&nbsp;·&nbsp;
            Superhost&nbsp;·&nbsp;
            {locationLabel}
          </p>
          <div>
            <button><Share2 size={14} />&nbsp;Share</button>
            <button><Heart size={14} />&nbsp;Save</button>
          </div>
        </div>
      </section>

      {/* ── gallery ── */}
      {listing.images.length > 0 && (
        <section className="gallery" aria-label="Listing photos">
          {listing.images.slice(0, 5).map((img, i) => (
            <img key={i} src={img} alt={`${listing.title} photo ${i + 1}`} />
          ))}
        </section>
      )}

      {/* ── two-column layout ── */}
      <section className="details-layout">

        {/* LEFT — description */}
        <div className="details-copy">

          {/* host summary */}
          <div className="host-summary">
            <div>
              <h2>{listing.type} hosted by {listing.host}</h2>
              <p>
                {listing.guests} guests &nbsp;·&nbsp;
                {listing.bedrooms} bedroom{listing.bedrooms !== 1 ? "s" : ""} &nbsp;·&nbsp;
                {listing.bathrooms} bath{listing.bathrooms !== 1 ? "s" : ""}
              </p>
            </div>
            <img
              src={`https://i.pravatar.cc/80?u=${encodeURIComponent(listing.host)}`}
              alt={listing.host}
            />
          </div>

          <hr />

          {/* key features */}
          <div className="feature-stack">
            <div>
              <Home size={20} />
              <span>
                <b>Entire home</b>
                <small>You'll have the place to yourself.</small>
              </span>
            </div>
            {listing.enhancedCleaning && (
              <div>
                <Sparkles size={20} />
                <span>
                  <b>Enhanced Clean</b>
                  <small>This host committed to Airbnb's enhanced cleaning process.</small>
                </span>
              </div>
            )}
            {listing.selfCheckIn && (
              <div>
                <Calendar size={20} />
                <span>
                  <b>Self check-in</b>
                  <small>Check yourself in with the lockbox.</small>
                </span>
              </div>
            )}
            <div>
              <Award size={20} />
              <span><b>Free cancellation before check-in</b></span>
            </div>
          </div>

          <hr />

          {/* description */}
          <p>{listing.description}</p>
          <button className="text-button">Show more</button>

          <hr />

          {/* bedroom */}
          <h3>Where you'll sleep</h3>
          <div className="sleep-card">
            <img
              src={listing.images?.[1] || listing.images?.[0] ||
                "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80"}
              alt="Bedroom"
            />
            <b>Bedroom{listing.bedrooms > 1 ? "s" : ""}</b>
            <span>{listing.bedrooms} {listing.bedrooms === 1 ? "queen bed" : `beds across ${listing.bedrooms} bedrooms`}</span>
          </div>

          {/* amenities */}
          <h3>What this place offers</h3>
          <div className="amenities amenities-grid">
            {amenityList.slice(0, 10).map((item) => (
              <span key={item}><Wifi size={15} />&nbsp;{item}</span>
            ))}
          </div>
          <button className="outline-button">Show all amenities</button>

          <hr />

          {/* reviews */}
          <h3>Reviews</h3>
          <div className="review-summary">
            <Star size={18} fill="currentColor" />
            &nbsp;{listing.rating}&nbsp;·&nbsp;{listing.reviews} reviews
          </div>

          {Object.keys(listing.specificRatings || {}).length > 0 && (
            <div className="rating-grid">
              {Object.entries(listing.specificRatings).map(([key, val]) => (
                <span key={key}>
                  {key}
                  <b style={{ width: `${Number(val) * 18}%` }} />
                  <em>{val}</em>
                </span>
              ))}
            </div>
          )}

          <div className="review-grid">
            {["Sipho", "Priya", "Zanele", "André"].map((name) => (
              <article key={name}>
                <img src={`https://i.pravatar.cc/80?u=${name}SA`} alt={name} />
                <b>{name}</b>
                <small>March 2025</small>
                <p>Amazing stay — well located, spotless, and the host was incredibly responsive.</p>
              </article>
            ))}
          </div>
          <button className="outline-button">Show all reviews</button>

          <hr />

          {/* host block */}
          <div className="host-block">
            <img
              src={`https://i.pravatar.cc/80?u=${encodeURIComponent(listing.host)}`}
              alt={listing.host}
            />
            <div>
              <h3>Hosted by {listing.host}</h3>
              <p>
                {listing.reviews} reviews &nbsp;·&nbsp;
                Identity verified &nbsp;·&nbsp; Superhost
              </p>
              <p>
                {listing.host} is a Superhost — highly rated and committed to providing
                great stays for every guest.
              </p>
              <button className="outline-button">Contact Host</button>
            </div>
          </div>

          <hr />

          {/* house rules */}
          <h3>House Rules, Health &amp; Safety, Cancellation Policy</h3>
          <div className="rules-grid">
            <p>
              <b>House rules</b> No smoking. No parties or events.
              Check-in after 3:00 PM. Check-out by 11:00 AM.
            </p>
            <p>
              <b>Health &amp; safety</b> Committed to enhanced cleaning.
              Carbon monoxide alarm installed.
            </p>
            <p>
              <b>Cancellation policy</b> Free cancellation before check-in date.
              Refer to the full policy for details.
            </p>
          </div>
        </div>

        {/* RIGHT — sticky calculator */}
        <aside className="calculator" aria-label="Booking calculator">
          <h2>
            {zarFmt(listing.price)} <span>/ night</span>
          </h2>

          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <Star size={14} fill="#ff385c" color="#ff385c" />
            <b>{listing.rating}</b>
            <span style={{ color: "var(--muted)" }}>
              · {listing.reviews} reviews
            </span>
          </div>

          <label>
            Check-in
            <input
              type="date"
              value={form.checkIn}
              min={today}
              onChange={(e) => setForm({ ...form, checkIn: e.target.value })}
            />
          </label>
          <label>
            Check-out
            <input
              type="date"
              value={form.checkOut}
              min={form.checkIn || today}
              onChange={(e) => setForm({ ...form, checkOut: e.target.value })}
            />
          </label>
          <label>
            Guests
            <input
              type="number"
              min="1"
              max={listing.guests}
              value={form.guests}
              onChange={(e) => setForm({ ...form, guests: Number(e.target.value) })}
            />
          </label>

          <button className="reserve" onClick={reserve}>
            Reserve
          </button>

          {message.text && (
            <p className={message.type} role="alert">
              {message.text}
            </p>
          )}

          {calc.nights > 0 && (
            <div className="price-lines">
              <span>
                {zarFmt(listing.price)} × {calc.nights} night{calc.nights !== 1 ? "s" : ""}
                <b>{zarFmt(calc.subtotal)}</b>
              </span>
              {calc.discount > 0 && (
                <span>
                  Weekly discount <b>−{zarFmt(calc.discount)}</b>
                </span>
              )}
              {listing.cleaningFee > 0 && (
                <span>
                  Cleaning fee <b>{zarFmt(listing.cleaningFee)}</b>
                </span>
              )}
              {listing.serviceFee > 0 && (
                <span>
                  Service fee <b>{zarFmt(listing.serviceFee)}</b>
                </span>
              )}
              {listing.occupancyTaxes > 0 && (
                <span>
                  Occupancy taxes <b>{zarFmt(listing.occupancyTaxes)}</b>
                </span>
              )}
              <strong>
                Total <b>{zarFmt(Math.max(calc.total, 0))}</b>
              </strong>
            </div>
          )}

          <p style={{ fontSize: 11, color: "var(--muted)", textAlign: "center", margin: 0 }}>
            You won't be charged yet
          </p>
        </aside>
      </section>

      <Footer />
    </div>
  );
}
