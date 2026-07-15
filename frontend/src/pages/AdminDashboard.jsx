import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, Home, Plus, TrendingUp, Users } from "lucide-react";
import { api } from "../api/client";
import { useAuth } from "../auth";
import { AdminNav } from "../components/AdminNav";

/**
 * AdminDashboard — overview page for hosts and admins.
 * Shows listing counts, reservation stats, revenue, and quick actions.
 */
export function AdminDashboard() {
  const { session } = useAuth();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");

    Promise.all([api.dashboardStats(), api.hostReservations()])
      .then(([statsData, reservations]) => {
        setStats(statsData);
        setRecent(Array.isArray(reservations) ? reservations.slice(0, 5) : []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const fmt = (dateStr) =>
    new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  return (
    <div className="page narrow admin-page">
      <AdminNav />

      <div className="admin-title">
        <div>
          <h1>Admin Dashboard</h1>
          <p>
            Welcome back, {session?.user?.username}
          </p>
        </div>
        <Link className="icon-action" to="/admin/create">
          <Plus size={16} /> Create Listing
        </Link>
      </div>

      {error && <p className="error" role="alert">{error}</p>}

      {loading ? (
        <p className="muted-text">Loading dashboard...</p>
      ) : error ? null : !stats ? (
        <div className="empty-state">
          <p>Dashboard data is not available yet.</p>
        </div>
      ) : (
        <>
          <div className="dashboard-stats">
            <article className="stat-card">
              <Home size={22} />
              <div>
                <strong>{stats.listings}</strong>
                <span>My Listings</span>
              </div>
            </article>
            <article className="stat-card">
              <Calendar size={22} />
              <div>
                <strong>{stats.hostReservations}</strong>
                <span>Host Reservations</span>
              </div>
            </article>
            <article className="stat-card">
              <Users size={22} />
              <div>
                <strong>{stats.guestReservations}</strong>
                <span>My Bookings</span>
              </div>
            </article>
            <article className="stat-card">
              <TrendingUp size={22} />
              <div>
                <strong>R {Number(stats.revenue).toLocaleString("en-ZA")}</strong>
                <span>Total Revenue</span>
              </div>
            </article>
          </div>

          <section className="dashboard-section">
            <div className="toolbar">
              <h2>Recent Host Reservations</h2>
              <Link className="admin-link" to="/reservations">
                View all
              </Link>
            </div>

            {recent.length === 0 ? (
              <p className="muted-text">
                No reservations yet. Share your listings to start receiving bookings.
              </p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Listing</th>
                      <th>Guest</th>
                      <th>Check-in</th>
                      <th>Check-out</th>
                      <th>Total</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((res) => (
                      <tr key={res._id}>
                        <td>{res.accommodation?.title || "-"}</td>
                        <td>{res.user?.username || res.user?.email || "-"}</td>
                        <td>{res.checkIn ? fmt(res.checkIn) : "-"}</td>
                        <td>{res.checkOut ? fmt(res.checkOut) : "-"}</td>
                        <td>R {Number(res.total || 0).toLocaleString("en-ZA")}</td>
                        <td>
                          <span className={`status-badge status-${res.status || "confirmed"}`}>
                            {res.status || "confirmed"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
