import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import "./styles/app.css";
import { AuthProvider, useAuth } from "./auth";
import { Header } from "./components/Header";
import { Home } from "./pages/Home";
import { Locations } from "./pages/Locations";
import { ListingDetails } from "./pages/ListingDetails";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Reservations } from "./pages/Reservations";
import { AdminDashboard } from "./pages/AdminDashboard";
import { AdminListings } from "./pages/AdminListings";
import { ListingForm } from "./pages/ListingForm";
import { Profile } from "./pages/Profile";

/**
 * Protected route wrapper — redirects unauthenticated users to /login.
 */
function Protected({ children }) {
  const { session } = useAuth();
  const location = useLocation();
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}

/**
 * Host-only routes — guests are redirected to reservations.
 */
function HostProtected({ children }) {
  const { session } = useAuth();
  const location = useLocation();
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!["host", "admin"].includes(session.user.role)) {
    return <Navigate to="/reservations" replace />;
  }
  return children;
}

/**
 * AppFrame — renders the persistent Header and all page routes.
 */
function AppFrame() {
  const navigate = useNavigate();
  return (
    <>
      <Header
        onSearch={({ location, checkIn, checkOut, guests }) => {
          const params = new URLSearchParams({
            location: location || "Cape Town"
          });

          if (checkIn) params.set("checkIn", checkIn);
          if (checkOut) params.set("checkOut", checkOut);
          if (guests) params.set("guests", String(guests));

          navigate(`/locations?${params.toString()}`);
        }}
      />
      <main>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/locations" element={<Locations />} />
          <Route path="/locations/:id" element={<ListingDetails />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes — require a valid session */}
          <Route path="/reservations" element={<Protected><Reservations /></Protected>} />
          <Route path="/profile" element={<Protected><Profile /></Protected>} />
          <Route path="/admin" element={<HostProtected><AdminDashboard /></HostProtected>} />
          <Route path="/admin/listings" element={<HostProtected><AdminListings /></HostProtected>} />
          <Route path="/admin/create" element={<HostProtected><ListingForm /></HostProtected>} />
          <Route path="/admin/:id/edit" element={<HostProtected><ListingForm /></HostProtected>} />

          {/* Catch-all — redirect unknown paths to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppFrame />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
