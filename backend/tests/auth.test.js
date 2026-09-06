const request = require("supertest");
const app = require("../app");

describe("POST /api/users/register", () => {
  test("creates a new user and returns a token", async () => {
    const res = await request(app).post("/api/users/register").send({
      username: "New Guest",
      email: "newguest@example.com",
      password: "password123"
    });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe("user");
  });

  test("rejects registration with a duplicate email", async () => {
    const res = await request(app).post("/api/users/register").send({
      username: "Duplicate",
      email: "john@example.com", // already seeded
      password: "password123"
    });
    expect(res.status).toBe(409);
  });

  test("rejects a password shorter than 6 characters", async () => {
    const res = await request(app).post("/api/users/register").send({
      username: "Short Pass",
      email: "shortpass@example.com",
      password: "123"
    });
    expect(res.status).toBe(400);
  });

  test("ignores an attempt to self-register as admin and falls back to 'user'", async () => {
    const res = await request(app).post("/api/users/register").send({
      username: "Sneaky",
      email: "sneaky@example.com",
      password: "password123",
      role: "admin"
    });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe("user");
  });
});

describe("POST /api/users/login", () => {
  test("logs in with correct seeded credentials", async () => {
    const res = await request(app).post("/api/users/login").send({
      email: "john@example.com",
      password: "password123"
    });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe("user");
  });

  test("rejects an incorrect password", async () => {
    const res = await request(app).post("/api/users/login").send({
      email: "john@example.com",
      password: "wrongpassword"
    });
    expect(res.status).toBe(401);
  });

  test("rejects a non-existent email", async () => {
    const res = await request(app).post("/api/users/login").send({
      email: "doesnotexist@example.com",
      password: "password123"
    });
    expect(res.status).toBe(401);
  });
});

describe("GET /api/users/profile (protected route)", () => {
  test("rejects requests with no token", async () => {
    const res = await request(app).get("/api/users/profile");
    expect(res.status).toBe(401);
  });

  test("rejects requests with an invalid token", async () => {
    const res = await request(app).get("/api/users/profile").set("Authorization", "Bearer not-a-real-token");
    expect(res.status).toBe(401);
  });

  test("returns the user profile with a valid token", async () => {
    const login = await request(app).post("/api/users/login").send({
      email: "jane@example.com",
      password: "password321"
    });
    const token = login.body.token;

    const res = await request(app).get("/api/users/profile").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("jane@example.com");
    expect(res.body.user.role).toBe("host");
  });
});
