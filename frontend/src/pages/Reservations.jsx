import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../auth";

/**
 * Reservations — protected page for viewing and cancelling reservations.
 * Toggle between "Mine" (guest view) and "Host" (host view).
 */
export function Reservations() {
  const { session } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [mode, setMode] = useState("user");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const isHost = ["host", "admin"].includes(session?.user?.role);

  const load = () => {
    setError("");
    setFeedback("");
    setLoading(true);
    const fetch = mode === "host" ? api.hostReservations : api.userReservations;
    fetch()
      .then(setReservations)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const cancel = async (id) => {
    if (!window.confirm("Cancel this reservation?")) return;
    try {
      await api.deleteReservation(id);
      setFeedback("Reservation cancelled.");
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const fmt = (dateStr) =>
    new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  return (
    <div className="page narrow" style={{ paddingTop: 34 }}>
      <div className="toolbar">
        <h1 style={{ margin: 0 }}>Reservations</h1>
        <div className="segmented" role="group" aria-label="Reservation view">
          <button
            className={mode === "user" ? "active" : ""}
            onClick={() => setMode("user")}
            aria-pressed={mode === "user"}
          >
            Mine
          </button>
          {isHost && (
            <button
              className={mode === "host" ? "active" : ""}
              onClick={() => setMode("host")}
              aria-pressed={mode === "host"}
            >
              Host
            </button>
          )}
        </div>
      </div>

      {error && <p className="error" role="alert">{error}</p>}
      {feedback && <p className="feedback" role="status">{feedback}</p>}

      {loading ? (
        <p style={{ color: "var(--muted)", marginTop: 24 }}>Loading reservations…</p>
      ) : reservations.length === 0 ? (
        <div className="empty-state">
          <p>No reservations found.</p>
          <Link to="/locations?location=Cape Town">Browse listings to book a stay</Link>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Listing</th>
                <th>Location</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Guests</th>
                <th>Nights</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((res) => (
                <tr key={res._id}>
                  <td>{res.accommodation?.title || "-"}</td>
                  <td>{res.accommodation?.location || "-"}</td>
                  <td>{res.checkIn ? fmt(res.checkIn) : "-"}</td>
                  <td>{res.checkOut ? fmt(res.checkOut) : "-"}</td>
                  <td>{res.guests}</td>
                  <td>{res.nights}</td>
                  <td>R {Number(res.total || 0).toLocaleString("en-ZA")}</td>
                  <td>
                    <span className={`status-badge status-${res.status || "confirmed"}`}>
                      {res.status || "confirmed"}
                    </span>
                  </td>
                  <td>
                    {res.status !== "cancelled" && (
                      <button
                        className="cancel-res-btn"
                        onClick={() => cancel(res._id)}
                        title="Cancel reservation"
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
