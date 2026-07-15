import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { api } from "../api/client";

/**
 * Profile — account settings page.
 * Lets the authenticated user update their display name and password.
 * Hosts can also see their host status and a link to the dashboard.
 */
export function Profile() {
  const { session, setSession, logout } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: session?.user?.username || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [feedback, setFeedback] = useState({ text: "", type: "" });
  const [loading, setLoading]   = useState(false);

  if (!session) {
    navigate("/login");
    return null;
  }

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const saveProfile = async (e) => {
    e.preventDefault();
    setFeedback({ text: "", type: "" });

    if (!form.username.trim()) {
      return setFeedback({ text: "Name cannot be empty.", type: "error" });
    }

    if (form.newPassword) {
      if (form.newPassword.length < 6) {
        return setFeedback({ text: "New password must be at least 6 characters.", type: "error" });
      }
      if (form.newPassword !== form.confirmPassword) {
        return setFeedback({ text: "Passwords do not match.", type: "error" });
      }
      if (!form.currentPassword) {
        return setFeedback({ text: "Enter your current password to change it.", type: "error" });
      }
    }

    setLoading(true);
    try {
      const updated = await api.updateProfile({
        username: form.username.trim(),
        currentPassword: form.currentPassword || undefined,
        newPassword: form.newPassword || undefined
      });
      // Refresh the session token and user info
      const updatedSession = { token: updated.token, user: updated.user };
      setSession(updatedSession);
      setForm((prev) => ({ ...prev, currentPassword: "", newPassword: "", confirmPassword: "" }));
      setFeedback({ text: "Profile updated successfully.", type: "feedback" });
    } catch (err) {
      setFeedback({ text: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const initials = session.user.username
    ? session.user.username.charAt(0).toUpperCase()
    : "?";

  const isHost = ["host", "admin"].includes(session.user.role);

  return (
    <div className="page narrow profile-page">
      <div className="profile-avatar-circle">{initials}</div>
      <h1>Account Settings</h1>

      {isHost && (
        <div className="become-host-banner">
          <strong>You are a Host 🏠</strong>
          Manage your listings and reservations from the{" "}
          <a href="/admin">Admin Dashboard</a>.
        </div>
      )}

      {!isHost && (
        <div className="become-host-banner">
          <strong>Want to become a Host?</strong>
          Create a new account and select "List my place as a host", or contact us to upgrade.
        </div>
      )}

      <form className="profile-form" onSubmit={saveProfile}>
        <p className="profile-section-title">Personal info</p>

        <label>
          Full name
          <input
            type="text"
            value={form.username}
            onChange={(e) => set("username", e.target.value)}
            placeholder="Your name"
            required
          />
        </label>

        <label>
          Email address
          <input
            type="email"
            value={session.user.email}
            disabled
            style={{ background: "#f7f7f7", color: "#999" }}
          />
        </label>

        <label>
          Role
          <input
            type="text"
            value={session.user.role}
            disabled
            style={{ background: "#f7f7f7", color: "#999", textTransform: "capitalize" }}
          />
        </label>

        <p className="profile-section-title">Change password</p>

        <label>
          Current password
          <input
            type="password"
            value={form.currentPassword}
            onChange={(e) => set("currentPassword", e.target.value)}
            placeholder="Leave blank to keep current"
            autoComplete="current-password"
          />
        </label>

        <label>
          New password
          <input
            type="password"
            value={form.newPassword}
            onChange={(e) => set("newPassword", e.target.value)}
            placeholder="At least 6 characters"
            autoComplete="new-password"
          />
        </label>

        <label>
          Confirm new password
          <input
            type="password"
            value={form.confirmPassword}
            onChange={(e) => set("confirmPassword", e.target.value)}
            placeholder="Re-enter new password"
            autoComplete="new-password"
          />
        </label>

        {feedback.text && (
          <p className={feedback.type} role="alert">{feedback.text}</p>
        )}

        <button type="submit" className="reserve" disabled={loading}>
          {loading ? "Saving…" : "Save changes"}
        </button>
      </form>

      <div className="profile-danger-zone">
        <h3>Account actions</h3>
        <button type="button" onClick={handleLogout}>
          Log out
        </button>
      </div>
    </div>
  );
}
