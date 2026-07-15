import React from "react";
import { NavLink } from "react-router-dom";

/**
 * Shared admin navigation bar used across dashboard, listings, and form pages.
 */
export function AdminNav() {
  return (
    <nav className="admin-nav" aria-label="Admin navigation">
      <NavLink to="/admin" end>Dashboard</NavLink>
      <NavLink to="/admin/listings">My Listings</NavLink>
      <NavLink to="/admin/create">Create Listing</NavLink>
      <NavLink to="/reservations">Reservations</NavLink>
    </nav>
  );
}
