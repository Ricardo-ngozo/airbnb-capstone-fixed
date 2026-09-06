import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { Login } from "./Login";
import { AuthProvider } from "../auth";
import { api } from "../api/client";

// Mock the API client so no real network/backend is needed for these tests.
vi.mock("../api/client", () => ({
  api: { login: vi.fn() }
}));

const renderLogin = () =>
  render(
    <MemoryRouter initialEntries={["/login"]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<div>Home Page</div>} />
          <Route path="/admin" element={<div>Admin Dashboard</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe("Login page validation", () => {
  test("shows an error for an invalid email address", async () => {
    renderLogin();
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "not-an-email" } });
    fireEvent.change(screen.getByPlaceholderText("Your password"), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: /log in/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/valid email/i);
    expect(api.login).not.toHaveBeenCalled();
  });

  test("shows an error for a password under 6 characters", async () => {
    renderLogin();
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "guest@demo.com" } });
    fireEvent.change(screen.getByPlaceholderText("Your password"), { target: { value: "123" } });
    fireEvent.click(screen.getByRole("button", { name: /log in/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/6 characters/i);
    expect(api.login).not.toHaveBeenCalled();
  });
});

describe("Login page submission", () => {
  test("redirects a guest (role: user) to the home page", async () => {
    api.login.mockResolvedValue({ token: "fake-token", user: { id: "1", username: "Guest", email: "guest@demo.com", role: "user" } });
    renderLogin();

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "guest@demo.com" } });
    fireEvent.change(screen.getByPlaceholderText("Your password"), { target: { value: "Guest123!" } });
    fireEvent.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => expect(screen.getByText("Home Page")).toBeInTheDocument());
  });

  test("redirects a host to the admin dashboard", async () => {
    api.login.mockResolvedValue({ token: "fake-token", user: { id: "2", username: "Host", email: "host@demo.com", role: "host" } });
    renderLogin();

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "host@demo.com" } });
    fireEvent.change(screen.getByPlaceholderText("Your password"), { target: { value: "Host123!" } });
    fireEvent.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => expect(screen.getByText("Admin Dashboard")).toBeInTheDocument());
  });

  test("redirects an admin to the admin dashboard", async () => {
    api.login.mockResolvedValue({ token: "fake-token", user: { id: "3", username: "Admin", email: "admin@demo.com", role: "admin" } });
    renderLogin();

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "admin@demo.com" } });
    fireEvent.change(screen.getByPlaceholderText("Your password"), { target: { value: "Admin123!" } });
    fireEvent.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => expect(screen.getByText("Admin Dashboard")).toBeInTheDocument());
  });

  test("shows the server error message on failed login", async () => {
    api.login.mockRejectedValue(new Error("Invalid email or password"));
    renderLogin();

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "guest@demo.com" } });
    fireEvent.change(screen.getByPlaceholderText("Your password"), { target: { value: "wrongpassword" } });
    fireEvent.click(screen.getByRole("button", { name: /log in/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/invalid email or password/i);
  });
});
