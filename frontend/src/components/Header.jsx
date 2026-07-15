import React, { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Menu, Search, SlidersHorizontal, UserCircle } from "lucide-react";
import { useAuth } from "../auth";

/* ── nav tab definitions ─────────────────────────────────── */
const NAV_TABS = [
  { label: "All",         icon: "globe",     to: "/locations?location=Cape Town" },
  { label: "Homes",       icon: "home",      to: "/locations?location=Johannesburg" },
  { label: "Experiences", icon: "sparkle",   to: "/locations?location=Cape Town" },
  { label: "Services",    icon: "concierge", to: "/locations?location=Durban" }
];

function LuxuryNavIcon({ type }) {
  const common = { className: "nav-tab-svg", viewBox: "0 0 32 32", fill: "none", stroke: "currentColor", strokeWidth: "1.7", strokeLinecap: "round", strokeLinejoin: "round" };

  const icons = {
    globe: (
      <svg {...common} aria-hidden="true">
        <circle cx="16" cy="16" r="10" />
        <path d="M6 16h20M16 6v20M9 9.5c1.9 1.6 3.2 4.1 3.2 6.5s-1.3 4.9-3.2 6.5M23 9.5c-1.9 1.6-3.2 4.1-3.2 6.5s1.3 4.9 3.2 6.5" />
      </svg>
    ),
    home: (
      <svg {...common} aria-hidden="true">
        <path d="M5 15.5 16 7l11 8.5" />
        <path d="M8 13.5V26h16V13.5" />
        <path d="M13 26v-8h6v8" />
      </svg>
    ),
    sparkle: (
      <svg {...common} aria-hidden="true">
        <path d="M16 5l2.4 7.6L26 15l-7.6 2.4L16 25l-2.4-7.6L6 15l7.6-2.4L16 5Z" />
      </svg>
    ),
    concierge: (
      <svg {...common} aria-hidden="true">
        <path d="M10 23V13a6 6 0 1 1 12 0v10" />
        <path d="M8 23h16" />
        <path d="M13 23v-6h6v6" />
        <circle cx="16" cy="10" r="1.8" />
      </svg>
    )
  };

  return icons[type] || icons.globe;
}

function AirbnbLogoMark() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" className="brand2-icon">
      <path d="M32 54c-3.8-5.1-7.1-9.7-9.8-13.7-2 2.5-4.8 4-8.1 4C7.4 44.3 2 39 2 32.4c0-4.5 2.4-8.8 6.4-11.1 2.8-1.6 5.9-2 8.7-1C21.3 10.7 26.1 4 32 4s10.7 6.7 14.9 16.3c2.8-1 5.9-.6 8.7 1 4 2.3 6.4 6.6 6.4 11.1 0 6.6-5.4 11.9-12.1 11.9-3.3 0-6.1-1.5-8.1-4C39.1 44.3 35.8 48.9 32 54Zm-6.5-18.7c1.9 2.9 4.1 6.2 6.5 9.6 2.4-3.4 4.6-6.7 6.5-9.6L32 25.8l-6.5 9.5Zm22.9-9.2c1.3 3.2.3 6.7-2.7 10.9 1.1 1.3 2.5 2 4.2 2 3.8 0 6.8-2.9 6.8-6.6 0-2.6-1.4-5-3.7-6.4-1.5-.9-3.2-1.1-4.6-.8v.9ZM14.1 25.2c-1.4-.3-3.1-.1-4.6.8-2.3 1.4-3.7 3.8-3.7 6.4 0 3.7 3 6.6 6.8 6.6 1.7 0 3.1-.7 4.2-2-3-4.2-4-7.7-2.7-10.9v-.9Zm7 5.2L32 14.3l10.9 16.1c1.4-2.8-.4-8.1-2.7-12.6C37.5 12.4 34.4 9.3 32 9.3s-5.5 3.1-8.2 8.5c-2.3 4.5-4.1 9.8-2.7 12.6Z" />
    </svg>
  );
}

export function Header({ onSearch }) {
  const [where, setWhere] = useState("Cape Town");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);
  const [open, setOpen] = useState(false);
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const isHome = pathname === "/";

  /* derive active tab from current path */
  const activeTab = (() => {
    if (pathname === "/") return "Experiences";
    if (pathname.startsWith("/locations")) return "All";
    return "";
  })();

  /* close profile menu on navigation or Escape */
  useEffect(() => { setOpen(false); }, [pathname, search]);
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(search);
    const nextWhere = params.get("location");
    const nextCheckIn = params.get("checkIn");
    const nextCheckOut = params.get("checkOut");
    const nextGuests = params.get("guests");

    if (nextWhere) setWhere(nextWhere);
    if (nextCheckIn) setCheckIn(nextCheckIn);
    if (nextCheckOut) setCheckOut(nextCheckOut);
    if (nextGuests) setGuests(Number(nextGuests) || 2);
  }, [search]);

  const handleSearch = (e) => {
    e.preventDefault();
    const nextLocation = where.trim() || "Cape Town";
    onSearch({
      location: nextLocation,
      checkIn,
      checkOut,
      guests
    });
  };

  /* avatar initials from username */
  const initials = session?.user?.username
    ? session.user.username.charAt(0).toUpperCase()
    : null;

  return (
    <header className={`topbar2 ${isHome ? "topbar2-home" : ""}`}>

      {/* ════════════════════════════════
          ROW 1 — logo · tabs · profile
          ════════════════════════════════ */}
      <div className="topbar2-row1">

        {/* Logo */}
        <Link className="brand2" to="/" aria-label="Airbnb home">
          <AirbnbLogoMark />
          <span>airbnb</span>
        </Link>

        {/* Nav tabs */}
        <nav className="nav-tabs" aria-label="Main navigation">
          {NAV_TABS.map(({ label, icon, to }) => (
            <NavLink
              key={label}
              to={to}
              className={`nav-tab ${activeTab === label ? "nav-tab-active" : ""}`}
              aria-current={activeTab === label ? "page" : undefined}
            >
              <span className="nav-tab-emoji" aria-hidden="true"><LuxuryNavIcon type={icon} /></span>
              <span className="nav-tab-label">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Right: become a host + avatar + hamburger */}
        <div className="profile-wrap2">
          {session
            ? <span className="host-link2">{session.user.username}</span>
            : <Link className="host-link2" to="/register">Become a host</Link>
          }

          <button
            className="avatar-btn"
            onClick={() => setOpen((v) => !v)}
            aria-label="Profile menu"
            aria-expanded={open}
          >
            {initials
              ? <span className="avatar-initials">{initials}</span>
              : <UserCircle size={28} strokeWidth={1.4} />
            }
            <Menu size={16} strokeWidth={2} />
          </button>

          {/* Dropdown */}
          {open && (
            <div className="profile-menu" role="menu">
              {session ? (
                <>
                  <strong className="menu-greeting">Hello, {session.user.username}</strong>
                  <button role="menuitem" onClick={() => navigate("/profile")}>My account</button>
                  <button role="menuitem" onClick={() => navigate("/reservations")}>View reservations</button>
                  {["host", "admin"].includes(session.user.role) && (
                    <button role="menuitem" onClick={() => navigate("/admin")}>Admin dashboard</button>
                  )}
                  <hr className="menu-divider" />
                  <button role="menuitem" onClick={logout}>Log out</button>
                </>
              ) : (
                <>
                  <button role="menuitem" onClick={() => navigate("/login")}>Log in</button>
                  <button role="menuitem" onClick={() => navigate("/register")}>Sign up</button>
                  <hr className="menu-divider" />
                  <button role="menuitem" onClick={() => navigate("/locations?location=Cape%20Town")}>Explore homes</button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ════════════════════════════════
          ROW 2 — search pill
          ════════════════════════════════ */}
      <div className="topbar2-row2">
        <form className="search-pill2" onSubmit={handleSearch} role="search">

          <div className="pill-field pill-where">
            <span className="pill-label">Where</span>
            <input
              className="pill-input"
              value={where}
              onChange={(e) => setWhere(e.target.value)}
              placeholder="Search destinations"
              aria-label="Search destinations"
            />
          </div>

          <div className="pill-divider" aria-hidden="true" />

          <div className="pill-field pill-when">
            <span className="pill-label">When</span>
            <div className="pill-date-stack">
              <label>
                <span>Check-in</span>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  aria-label="Check-in date"
                />
              </label>
              <label>
                <span>Check-out</span>
                <input
                  type="date"
                  value={checkOut}
                  min={checkIn || undefined}
                  onChange={(e) => setCheckOut(e.target.value)}
                  aria-label="Check-out date"
                />
              </label>
            </div>
          </div>

          <div className="pill-divider" aria-hidden="true" />

          <div className="pill-field pill-who">
            <span className="pill-label">Who</span>
            <select
              className="pill-select"
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
              aria-label="Number of guests"
            >
              {[1,2,3,4,5,6,8,10].map((count) => (
                <option key={count} value={count}>{count} guest{count > 1 ? "s" : ""}</option>
              ))}
            </select>
          </div>

          <button className="pill-search-btn" type="submit" aria-label="Search">
            <Search size={18} strokeWidth={2.5} />
          </button>
        </form>

        {/* Filter / grid icon on the right */}
        <button className="filter-icon-btn" aria-label="Filters">
          <SlidersHorizontal size={20} />
        </button>
      </div>

    </header>
  );
}
