const request = require("supertest");
const { app, db, createTestUser, getAuthToken, cleanupTables } = require("./helpers");

beforeEach(async () => {
  await cleanupTables();
});

describe("POST /api/auth/signup", () => {
  test("should register a new user successfully", async () => {
    const res = await request(app).post("/api/auth/signup").send({
      email: "new@example.com",
      password: "TestPass1!",
      options: { data: { name: "New User", user_type: "volunteer" } },
    });
    expect(res.body.error).toBeNull();
    expect(res.body.data.user).toBeTruthy();
    expect(res.body.data.user.email).toBe("new@example.com");
    expect(res.body.data.user.user_metadata.user_type).toBe("volunteer");
  });

  test("should fail with missing fields", async () => {
    const res = await request(app).post("/api/auth/signup").send({ email: "" });
    expect(res.body.error).toBeTruthy();
    expect(res.body.error.message).toMatch(/required/i);
  });

  test("should fail with duplicate email", async () => {
    await createTestUser({ email: "dup@example.com" });
    const res = await request(app).post("/api/auth/signup").send({
      email: "dup@example.com",
      password: "TestPass1!",
      options: { data: { name: "Dup", user_type: "volunteer" } },
    });
    expect(res.body.error).toBeTruthy();
    expect(res.body.error.message).toMatch(/already/i);
  });
});

describe("POST /api/auth/login", () => {
  test("should login successfully", async () => {
    await createTestUser({ email: "login@example.com", password: "TestPass1!" });
    const res = await request(app).post("/api/auth/login").send({
      email: "login@example.com",
      password: "TestPass1!",
    });
    expect(res.body.error).toBeNull();
    expect(res.body.data.session.access_token).toBeTruthy();
    expect(res.body.data.user.email).toBe("login@example.com");
  });

  test("should fail with wrong password", async () => {
    await createTestUser({ email: "wrong@example.com", password: "TestPass1!" });
    const res = await request(app).post("/api/auth/login").send({
      email: "wrong@example.com",
      password: "WrongPass!",
    });
    expect(res.body.error).toBeTruthy();
    expect(res.body.error.message).toMatch(/invalid/i);
  });

  test("should fail with non-existent user", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "nobody@example.com",
      password: "TestPass1!",
    });
    expect(res.body.error).toBeTruthy();
  });
});

describe("GET /api/auth/session", () => {
  test("should return session for valid token", async () => {
    await createTestUser({ email: "sess@example.com", password: "TestPass1!" });
    const token = await getAuthToken("sess@example.com", "TestPass1!");
    const res = await request(app)
      .get("/api/auth/session")
      .set("Authorization", `Bearer ${token}`);
    expect(res.body.data.session).toBeTruthy();
    expect(res.body.data.session.user.email).toBe("sess@example.com");
  });

  test("should return null session with no token", async () => {
    const res = await request(app).get("/api/auth/session");
    expect(res.body.data.session).toBeNull();
  });

  test("should return null session for invalid token", async () => {
    const res = await request(app)
      .get("/api/auth/session")
      .set("Authorization", "Bearer invalidtoken123");
    expect(res.body.data.session).toBeNull();
  });
});

describe("GET /api/auth/user", () => {
  test("should return user when authenticated", async () => {
    await createTestUser({ email: "user@example.com", password: "TestPass1!" });
    const token = await getAuthToken("user@example.com", "TestPass1!");
    const res = await request(app)
      .get("/api/auth/user")
      .set("Authorization", `Bearer ${token}`);
    expect(res.body.error).toBeNull();
    expect(res.body.data.user.email).toBe("user@example.com");
  });

  test("should fail when unauthenticated", async () => {
    const res = await request(app).get("/api/auth/user");
    expect(res.body.error).toBeTruthy();
  });
});

describe("PUT /api/auth/user", () => {
  test("should update password", async () => {
    await createTestUser({ email: "upd@example.com", password: "OldPass1!" });
    const token = await getAuthToken("upd@example.com", "OldPass1!");
    const res = await request(app)
      .put("/api/auth/user")
      .set("Authorization", `Bearer ${token}`)
      .send({ password: "NewPass1!" });
    expect(res.body.error).toBeNull();

    // Verify new password works
    const newToken = await getAuthToken("upd@example.com", "NewPass1!");
    expect(newToken).toBeTruthy();
  });

  test("should update metadata", async () => {
    await createTestUser({ email: "meta@example.com", password: "TestPass1!" });
    const token = await getAuthToken("meta@example.com", "TestPass1!");
    const res = await request(app)
      .put("/api/auth/user")
      .set("Authorization", `Bearer ${token}`)
      .send({ data: { name: "Updated Name" } });
    expect(res.body.error).toBeNull();
    expect(res.body.data.user.user_metadata.name).toBe("Updated Name");
  });
});

describe("POST /api/auth/reset-password", () => {
  test("should generate reset token", async () => {
    await createTestUser({ email: "reset@example.com", password: "TestPass1!" });
    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({ email: "reset@example.com" });
    expect(res.body.error).toBeNull();

    // Verify token was stored in DB
    const user = await db.prepare("SELECT reset_token FROM users WHERE email = ?").get("reset@example.com");
    expect(user.reset_token).toBeTruthy();
  });
});
