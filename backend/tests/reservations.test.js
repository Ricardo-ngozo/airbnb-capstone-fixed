const request = require("supertest");
const app = require("../app");

// Log in as the seeded guest (john) and return the JWT.
const loginAsGuest = async () => {
  const res = await request(app).post("/api/users/login").send({
    email: "john@example.com",
    password: "password123"
  });
  return res.body.token;
};

describe("POST /api/reservations", () => {
  test("rejects an unauthenticated booking attempt", async () => {
    const res = await request(app).post("/api/reservations").send({
      accommodationId: "inmem-ct-seapoint",
      checkIn: "2026-12-01",
      checkOut: "2026-12-05",
      guests: 2
    });
    expect(res.status).toBe(401);
  });

  test("rejects a booking for a non-existent accommodation", async () => {
    const token = await loginAsGuest();
    const res = await request(app)
      .post("/api/reservations")
      .set("Authorization", `Bearer ${token}`)
      .send({ accommodationId: "does-not-exist", checkIn: "2026-12-01", checkOut: "2026-12-05", guests: 2 });
    expect(res.status).toBe(404);
  });

  test("rejects check-out date before/equal to check-in date", async () => {
    const token = await loginAsGuest();
    const res = await request(app)
      .post("/api/reservations")
      .set("Authorization", `Bearer ${token}`)
      .send({ accommodationId: "inmem-ct-seapoint", checkIn: "2026-12-05", checkOut: "2026-12-05", guests: 2 });
    expect(res.status).toBe(400);
  });

  test("rejects a guest count over the accommodation's max", async () => {
    const token = await loginAsGuest();
    const res = await request(app)
      .post("/api/reservations")
      .set("Authorization", `Bearer ${token}`)
      .send({ accommodationId: "inmem-ct-seapoint", checkIn: "2026-12-01", checkOut: "2026-12-05", guests: 999 });
    expect(res.status).toBe(400);
  });

  test("creates a valid reservation and returns a calculated total", async () => {
    const token = await loginAsGuest();
    const res = await request(app)
      .post("/api/reservations")
      .set("Authorization", `Bearer ${token}`)
      .send({ accommodationId: "inmem-ct-seapoint", checkIn: "2026-12-01", checkOut: "2026-12-05", guests: 2 });
    expect(res.status).toBe(201);
    expect(res.body.nights).toBe(4);
    expect(res.body.total).toBeGreaterThan(0);
    expect(res.body.status).toBe("confirmed");
  });
});

describe("GET /api/reservations/user", () => {
  test("only returns reservations belonging to the authenticated guest", async () => {
    const token = await loginAsGuest();
    await request(app)
      .post("/api/reservations")
      .set("Authorization", `Bearer ${token}`)
      .send({ accommodationId: "inmem-ct-seapoint", checkIn: "2026-12-01", checkOut: "2026-12-05", guests: 2 });

    const res = await request(app).get("/api/reservations/user").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.every((r) => r.user.email === "john@example.com")).toBe(true);
  });
});
