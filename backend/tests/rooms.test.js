const request = require("supertest");
const { connectTestDb, disconnectTestDb, clearTestDb } = require("./testDb");

let app;

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

/** Registers a user and returns their auth token + id. */
async function registerUser(overrides = {}) {
  const res = await request(app)
    .post("/api/auth/register")
    .send({
      name: "Alice",
      email: "alice@example.com",
      password: "secret123",
      ...overrides,
    });
  return { token: res.body.token, user: res.body.user };
}

describe("Room endpoints require authentication", () => {
  it("rejects room creation with no token", async () => {
    const res = await request(app).post("/api/rooms").send({ name: "No Auth Room" });
    expect(res.status).toBe(401);
  });

  it("rejects listing rooms with no token", async () => {
    const res = await request(app).get("/api/rooms");
    expect(res.status).toBe(401);
  });
});

describe("POST /api/rooms", () => {
  it("creates a room and makes the caller owner + first member", async () => {
    const { token } = await registerUser();

    const res = await request(app)
      .post("/api/rooms")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Design Sync", description: "Weekly UI review" });

    expect(res.status).toBe(201);
    expect(res.body.room.name).toBe("Design Sync");
    expect(res.body.room.roomCode).toHaveLength(6);
    expect(res.body.room.members).toHaveLength(1);
  });

  it("rejects a room with no name", async () => {
    const { token } = await registerUser();

    const res = await request(app)
      .post("/api/rooms")
      .set("Authorization", `Bearer ${token}`)
      .send({ description: "Missing name" });

    expect(res.status).toBe(400);
  });
});

describe("GET /api/rooms", () => {
  it("lists only rooms the caller belongs to", async () => {
    const { token: tokenA } = await registerUser({ email: "a@example.com" });
    const { token: tokenB } = await registerUser({ email: "b@example.com" });

    await request(app)
      .post("/api/rooms")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ name: "Alice's Room" });

    await request(app)
      .post("/api/rooms")
      .set("Authorization", `Bearer ${tokenB}`)
      .send({ name: "Bob's Room" });

    const res = await request(app)
      .get("/api/rooms")
      .set("Authorization", `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.rooms[0].name).toBe("Alice's Room");
  });
});

describe("POST /api/rooms/join", () => {
  it("joins a room by its room code", async () => {
    const { token: ownerToken } = await registerUser({ email: "owner@example.com" });
    const { token: joinerToken } = await registerUser({ email: "joiner@example.com" });

    const createRes = await request(app)
      .post("/api/rooms")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ name: "Shared Room" });

    const { roomCode } = createRes.body.room;

    const joinRes = await request(app)
      .post("/api/rooms/join")
      .set("Authorization", `Bearer ${joinerToken}`)
      .send({ roomCode });

    expect(joinRes.status).toBe(200);
    expect(joinRes.body.message).toBe("Joined room");
    expect(joinRes.body.room.members).toHaveLength(2);
  });

  it("is idempotent when already a member", async () => {
    const { token } = await registerUser();

    const createRes = await request(app)
      .post("/api/rooms")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "My Room" });

    const { roomCode } = createRes.body.room;

    const joinRes = await request(app)
      .post("/api/rooms/join")
      .set("Authorization", `Bearer ${token}`)
      .send({ roomCode });

    expect(joinRes.status).toBe(200);
    expect(joinRes.body.message).toBe("You are already a member of this room");
  });

  it("returns 404 for a non-existent room code", async () => {
    const { token } = await registerUser();

    const res = await request(app)
      .post("/api/rooms/join")
      .set("Authorization", `Bearer ${token}`)
      .send({ roomCode: "ZZZZZZ" });

    expect(res.status).toBe(404);
  });
});

describe("POST /api/rooms/:id/leave", () => {
  it("deletes the room when the last member leaves", async () => {
    const { token } = await registerUser();

    const createRes = await request(app)
      .post("/api/rooms")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Solo Room" });

    const roomId = createRes.body.room._id;

    const leaveRes = await request(app)
      .post(`/api/rooms/${roomId}/leave`)
      .set("Authorization", `Bearer ${token}`);

    expect(leaveRes.status).toBe(200);
    expect(leaveRes.body.roomDeleted).toBe(true);
  });

  it("transfers ownership when the owner leaves but others remain", async () => {
    const { token: ownerToken } = await registerUser({ email: "owner2@example.com" });
    const { token: memberToken, user: member } = await registerUser({
      email: "member2@example.com",
    });

    const createRes = await request(app)
      .post("/api/rooms")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ name: "Team Room" });

    const roomId = createRes.body.room._id;
    const { roomCode } = createRes.body.room;

    await request(app)
      .post("/api/rooms/join")
      .set("Authorization", `Bearer ${memberToken}`)
      .send({ roomCode });

    const leaveRes = await request(app)
      .post(`/api/rooms/${roomId}/leave`)
      .set("Authorization", `Bearer ${ownerToken}`);

    expect(leaveRes.status).toBe(200);
    expect(leaveRes.body.roomDeleted).toBe(false);
    expect(String(leaveRes.body.room.owner._id || leaveRes.body.room.owner)).toBe(
      String(member._id)
    );
  });
});