const request = require("supertest");
const { connectTestDb, disconnectTestDb, clearTestDb } = require("./testDb");

let app;

// Order matters here: connect the test database BEFORE requiring the app,
// so the app's own real-database connection attempt never gets a chance
// to interfere with the in-memory one used for tests.
beforeAll(async () => {
  process.env.JWT_SECRET = "test-secret-key-for-jest";
  await connectTestDb();
  app = require("../server").app;
});

afterEach(async () => {
  await clearTestDb();
});

afterAll(async () => {
  await disconnectTestDb();
});

describe("POST /api/auth/register", () => {
  it("registers a new user and returns a token", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Sargun",
      email: "sargun@example.com",
      password: "secret123",
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe("sargun@example.com");
    expect(res.body.user.password).toBeUndefined();
  });

  it("rejects a duplicate email with 409", async () => {
    await request(app).post("/api/auth/register").send({
      name: "Sargun",
      email: "sargun@example.com",
      password: "secret123",
    });

    const res = await request(app).post("/api/auth/register").send({
      name: "Sargun Kaur",
      email: "sargun@example.com",
      password: "different123",
    });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it("rejects a password shorter than 6 characters", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Sargun",
      email: "short@example.com",
      password: "123",
    });

    expect(res.status).toBe(400);
  });

  it("rejects a missing name", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "noname@example.com",
      password: "secret123",
    });

    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    await request(app).post("/api/auth/register").send({
      name: "Pavan",
      email: "pavan@example.com",
      password: "secret123",
    });
  });

  it("logs in with correct credentials", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "pavan@example.com",
      password: "secret123",
    });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it("rejects an incorrect password with 401", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "pavan@example.com",
      password: "wrongpassword",
    });

    expect(res.status).toBe(401);
  });

  it("rejects a non-existent email with 401", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "ghost@example.com",
      password: "secret123",
    });

    expect(res.status).toBe(401);
  });
});