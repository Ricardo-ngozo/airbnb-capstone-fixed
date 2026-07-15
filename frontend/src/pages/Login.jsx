import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../auth";

const redirectAfterAuth = (session, fallback = "/") => {
  if (["host", "admin"].includes(session.user.role)) return "/admin";
  return fallback;
};

/**
 * Login — user authentication page.
 * On success the session (JWT + user) is stored and the user is redirected
 * to the admin dashboard (hosts) or their intended destination (guests).
 */
export function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { session, setSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || null;

  useEffect(() => {
    if (session) navigate(redirectAfterAuth(session, redirectTo || "/"), { replace: true });
  }, [session, navigate, redirectTo]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.email.includes("@")) return setError("Enter a valid email address.");
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");

    setLoading(true);
    try {
      const nextSession = await api.login(form);
      setSession(nextSession);
      navigate(redirectAfterAuth(nextSession, redirectTo || "/"), { replace: true });
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit} noValidate>

        {/* Airbnb-style logo at top of card */}
        <div style={{ textAlign: "center" }}>
          <svg viewBox="0 0 32 32" style={{ width: 40, fill: "#ff385c" }} aria-hidden="true">
            <path d="M16 1c-2.7 0-8.4 8.4-8.4 8.4S1 11.7 1 15.2c0 3 2.4 5.4 5.4 5.4 1.9 0 3.6-1 4.6-2.5L16 25l5-6.9c1 1.5 2.7 2.5 4.6 2.5 3 0 5.4-2.4 5.4-5.4 0-3.5-6.6-5.8-6.6-5.8S18.7 1 16 1zm0 3.2c1.2 1.8 5.2 7.8 5.2 7.8s4.6 1.7 4.6 3.2c0 1.2-1 2.2-2.2 2.2-.9 0-1.8-.6-2.1-1.4L16 9.6l-5.5 6.4c-.3.8-1.2 1.4-2.1 1.4-1.2 0-2.2-1-2.2-2.2 0-1.5 4.6-3.2 4.6-3.2S14.8 4.2 16 4.2z"/>
          </svg>
          <h1 style={{ marginTop: 8 }}>Welcome back</h1>
        </div>

        <label>
          Email address
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Your password"
            autoComplete="current-password"
            required
          />
        </label>

        {error && <p className="error" role="alert">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Logging in…" : "Log in"}
        </button>

        <p className="auth-hint">
          Demo accounts: <strong>guest@demo.com</strong> / Guest123! (guest) ·{" "}
          <strong>host@demo.com</strong> / Host123! (host) ·{" "}
          <strong>admin@demo.com</strong> / Admin123! (admin)
        </p>

        <div style={{ textAlign: "center", fontSize: 13, color: "#717171" }}>
          Don't have an account?{" "}
          <Link to="/register" style={{ color: "#ff385c", fontWeight: 700 }}>
            Sign up for free
          </Link>
        </div>

      </form>
    </div>
  );
}
