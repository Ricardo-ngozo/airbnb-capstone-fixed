import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Pencil, Plus, Star, Trash2 } from "lucide-react";
import { api, toAssetUrl } from "../api/client";
import { AdminNav } from "../components/AdminNav";

/**
 * AdminListings — protected page that shows listings owned by the
 * logged-in host. Each card displays real data from the API and provides
 * Update / Delete actions.
 */
export function AdminListings() {
  const [listings, setListings] = useState([]);
  const [message, setMessage] = useState({ text: "", type: "" });

  const load = () =>
    api.myListings().then(setListings).catch((err) => setMessage({ text: err.message, type: "error" }));

  useEffect(() => {
    load();
  }, []);

  const remove = async (id) => {
    if (!window.confirm("Are you sure you want to delete this listing?")) return;
    try {
      await api.deleteListing(id);
      setMessage({ text: "Listing deleted successfully.", type: "feedback" });
      load();
    } catch (error) {
      setMessage({ text: error.message, type: "error" });
    }
  };

  return (
    <div className="page narrow admin-page">
      <AdminNav />

      {/* ---- page title + create button ---- */}
      <div className="toolbar admin-title">
        <h1>My Listings</h1>
        <Link className="icon-action" to="/admin/create">
          <Plus size={16} /> Create Listing
        </Link>
      </div>

      {/* ---- feedback / error message ---- */}
      {message.text && (
        <p className={message.type} role="status">
          {message.text}
        </p>
      )}

      {/* ---- listing cards ---- */}
      {listings.length === 0 ? (
        <p style={{ color: "var(--muted)", marginTop: "32px" }}>
          No listings yet. <Link to="/admin/create" style={{ color: "var(--blue)" }}>Create one!</Link>
        </p>
      ) : (
        <div className="admin-list">
          {listings.map((listing) => {
            const coverImage = toAssetUrl(listing.images?.[0]) ||
              "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80";

            // Build a readable amenities string from real data
            const amenitiesLabel =
              Array.isArray(listing.amenities) && listing.amenities.length
                ? listing.amenities.slice(0, 4).join(" · ")
                : "No amenities listed";

            // Use real rating; fall back to 4.5 if missing
            const ratingLabel = listing.rating != null ? Number(listing.rating).toFixed(1) : "4.5";

            return (
              <article className="admin-card" key={listing._id}>
                <img
                  src={coverImage}
                  alt={listing.title}
                />
                <div>
                  <h2>{listing.title}</h2>
                  <p>
                    {listing.guests} Guest{listing.guests !== 1 ? "s" : ""} &nbsp;·&nbsp;
                    {listing.bedrooms} Bed{listing.bedrooms !== 1 ? "s" : ""} &nbsp;·&nbsp;
                    {listing.bathrooms} Bath{listing.bathrooms !== 1 ? "s" : ""}
                  </p>
                  {/* Real amenities from listing data */}
                  <p>{amenitiesLabel}</p>
                  {/* Real rating from listing data */}
                  <strong>
                    <Star size={13} fill="#e79a15" color="#e79a15" />
                    {ratingLabel}
                    <span>({listing.reviews || 0} reviews)</span>
                  </strong>
                  <b>R {Number(listing.price).toLocaleString("en-ZA")} <small>/night</small></b>
                  <div className="row-actions">
                    <Link to={`/admin/${listing._id}/edit`}>
                      <Pencil size={16} /> Update
                    </Link>
                    <button onClick={() => remove(listing._id)}>
                      <Trash2 size={16} /> Delete
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
