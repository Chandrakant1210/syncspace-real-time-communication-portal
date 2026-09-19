const request = require("supertest");
jest.mock("axios");
const axios = require("axios");

const { connectTestDb, disconnectTestDb, clearTestDb } = require("./testDb");

let app;

beforeAll(async () => {
  process.env.JWT_SECRET = "test-secret-key-for-jest";
  await connectTestDb();
  app = require("../server").app;
});

afterEach(async () => {
  await clearTestDb();
  jest.clearAllMocks();
});

afterAll(async () => {
  await disconnectTestDb();
});

async function getToken() {
  const res = await request(app).post("/api/auth/register").send({
    name: "Runner",
    email: `runner-${Date.now()}@example.com`,
    password: "secret123",
  });
  return res.body.token;
}

describe("POST /api/code/run — auth", () => {
  it("rejects with no token", async () => {
    const res = await request(app)
      .post("/api/code/run")
      .send({ language: "python", code: "print(1)" });

    expect(res.status).toBe(401);
  });
});

describe("POST /api/code/run — validation", () => {
  it("rejects a missing language", async () => {
    const token = await getToken();
    const res = await request(app)
      .post("/api/code/run")
      .set("Authorization", `Bearer ${token}`)
      .send({ code: "print(1)" });

    expect(res.status).toBe(400);
  });

  it("rejects empty code", async () => {
    const token = await getToken();
    const res = await request(app)
      .post("/api/code/run")
      .set("Authorization", `Bearer ${token}`)
      .send({ language: "python", code: "" });

    expect(res.status).toBe(400);
  });

  it("rejects an unsupported language", async () => {
    const token = await getToken();
    const res = await request(app)
      .post("/api/code/run")
      .set("Authorization", `Bearer ${token}`)
      .send({ language: "ruby", code: "puts 1" });

    expect(res.status).toBe(400);
  });
});

describe("POST /api/code/run — successful execution (mocked Piston)", () => {
  it("returns stdout for a successful run", async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        run: { stdout: "Hello SyncSpace\n", stderr: "", code: 0, signal: null },
      },
    });

    const token = await getToken();
    const res = await request(app)
      .post("/api/code/run")
      .set("Authorization", `Bearer ${token}`)
      .send({ language: "python", code: "print('Hello SyncSpace')" });

    expect(res.status).toBe(200);
    expect(res.body.result.stdout).toBe("Hello SyncSpace\n");
    expect(res.body.result.exitCode).toBe(0);
    expect(res.body.result.limitExceeded).toBeNull();
  });

  it("surfaces a compile error separately from stdout", async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        compile: { stderr: "syntax error", code: 1 },
        run: { stdout: "", stderr: "", code: null, signal: null },
      },
    });

    const token = await getToken();
    const res = await request(app)
      .post("/api/code/run")
      .set("Authorization", `Bearer ${token}`)
      .send({ language: "cpp", code: "int main() { broken" });

    expect(res.status).toBe(200);
    expect(res.body.result.compileError).toBe("syntax error");
  });
});

describe("POST /api/code/run — sandbox limits (mocked Piston)", () => {
  it("reports a timeout as limitExceeded: 'timeout'", async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        run: {
          stdout: "",
          stderr: "",
          code: null,
          signal: "SIGKILL",
          status: "TO",
          message: "Time limit exceeded (wall clock)",
        },
      },
    });

    const token = await getToken();
    const res = await request(app)
      .post("/api/code/run")
      .set("Authorization", `Bearer ${token}`)
      .send({ language: "javascript", code: "while(true){}" });

    expect(res.status).toBe(200);
    expect(res.body.result.limitExceeded).toBe("timeout");
    expect(res.body.result.limitError).toMatch(/timed out/i);
  });

  it("reports an OOM kill as limitExceeded: 'memory'", async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        run: {
          stdout: "",
          stderr: "",
          code: 137,
          signal: "SIGKILL",
          memory: 260000000,
        },
      },
    });

    const token = await getToken();
    const res = await request(app)
      .post("/api/code/run")
      .set("Authorization", `Bearer ${token}`)
      .send({ language: "javascript", code: "const x = []; while(true) x.push(1);" });

    expect(res.status).toBe(200);
    expect(res.body.result.limitExceeded).toBe("memory");
  });
});

describe("POST /api/code/run — upstream failures (mocked Piston)", () => {
  it("returns 503 when Piston is unreachable", async () => {
    axios.post.mockRejectedValueOnce({ response: null, code: "ECONNREFUSED" });

    const token = await getToken();
    const res = await request(app)
      .post("/api/code/run")
      .set("Authorization", `Bearer ${token}`)
      .send({ language: "python", code: "print(1)" });

    expect(res.status).toBe(503);
  });

  it("returns 503 when Piston answers 401 (public API offline)", async () => {
    axios.post.mockRejectedValueOnce({
      response: { status: 401, data: { message: "unauthorized" } },
    });

    const token = await getToken();
    const res = await request(app)
      .post("/api/code/run")
      .set("Authorization", `Bearer ${token}`)
      .send({ language: "python", code: "print(1)" });

    expect(res.status).toBe(503);
  });
});