import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../auth";

/**
 * Register — new user sign-up page.
 * Users choose their own name, email, password and account type.
 * On success they are automatically logged in and redirected home.
 */
export function Register() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "user"
  });
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const { setSession } = useAuth();
  const navigate = useNavigate();

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    // ---- client-side validation ----
    if (!form.username.trim())
      return setError("Please enter your name.");
    if (!form.email.includes("@"))
      return setError("Enter a valid email address.");
    if (form.password.length < 6)
      return setError("Password must be at least 6 characters.");
    if (form.password !== form.confirmPassword)
      return setError("Passwords do not match.");

    setLoading(true);
    try {
      const { confirmPassword: _discard, ...payload } = form;
      const session = await api.register(payload);
      setSession(session);
      navigate(["host", "admin"].includes(session.user.role) ? "/admin" : "/");
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit} noValidate>

        {/* Logo */}
        <div style={{ textAlign: "center" }}>
          <svg viewBox="0 0 32 32" style={{ width: 40, fill: "#ff385c" }} aria-hidden="true">
            <path d="M16 1c-2.7 0-8.4 8.4-8.4 8.4S1 11.7 1 15.2c0 3 2.4 5.4 5.4 5.4 1.9 0 3.6-1 4.6-2.5L16 25l5-6.9c1 1.5 2.7 2.5 4.6 2.5 3 0 5.4-2.4 5.4-5.4 0-3.5-6.6-5.8-6.6-5.8S18.7 1 16 1zm0 3.2c1.2 1.8 5.2 7.8 5.2 7.8s4.6 1.7 4.6 3.2c0 1.2-1 2.2-2.2 2.2-.9 0-1.8-.6-2.1-1.4L16 9.6l-5.5 6.4c-.3.8-1.2 1.4-2.1 1.4-1.2 0-2.2-1-2.2-2.2 0-1.5 4.6-3.2 4.6-3.2S14.8 4.2 16 4.2z"/>
          </svg>
          <h1 style={{ marginTop: 8 }}>Create your account</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#717171" }}>
            Join millions of people discovering unique places to stay.
          </p>
        </div>

        {/* Name */}
        <label>
          Full name
          <input
            type="text"
            value={form.username}
            onChange={(e) => set("username", e.target.value)}
            placeholder="Your name"
            autoComplete="name"
            required
          />
        </label>

        {/* Email */}
        <label>
          Email address
          <input
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </label>

        {/* Password */}
        <label>
          Password
          <input
            type="password"
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
            placeholder="At least 6 characters"
            autoComplete="new-password"
            minLength={6}
            required
          />
        </label>

        {/* Confirm password */}
        <label>
          Confirm password
          <input
            type="password"
            value={form.confirmPassword}
            onChange={(e) => set("confirmPassword", e.target.value)}
            placeholder="Re-enter your password"
            autoComplete="new-password"
            required
          />
        </label>

        {/* Account type */}
        <label>
          I want to…
          <select value={form.role} onChange={(e) => set("role", e.target.value)}>
            <option value="user">Book stays as a guest</option>
            <option value="host">List my place as a host</option>
          </select>
        </label>

        {/* Error */}
        {error && <p className="error" role="alert">{error}</p>}

        {/* Submit */}
        <button type="submit" disabled={loading}>
          {loading ? "Creating account…" : "Create account"}
        </button>

        {/* Terms note */}
        <p style={{ fontSize: 11, color: "#717171", textAlign: "center", margin: 0 }}>
          By signing up you agree to our Terms of Service and Privacy Policy.
        </p>

        {/* Link to login */}
        <div style={{ textAlign: "center", fontSize: 13, color: "#717171" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "#ff385c", fontWeight: 700 }}>
            Log in
          </Link>
        </div>

      </form>
    </div>
  );
}
