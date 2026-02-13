const request = require("supertest");
const { app, createTestUser, createAuthenticatedUser, cleanupTables } = require("./helpers");

let token;

beforeEach(async () => {
  await cleanupTables();
  const user = await createAuthenticatedUser({ user_type: "admin" });
  token = user.token;
});

describe("POST /api/notifications", () => {
  test("should create a notification", async () => {
    const res = await request(app).post("/api/notifications").send({
      title: "Test Alert",
      message: "This is a test",
      recipient_email: "user@test.com",
      priority: "high",
    }).set("Authorization", `Bearer ${token}`);
    expect(res.body.error).toBeNull();
    expect(res.body.data.title).toBe("Test Alert");
    expect(res.body.data.is_read).toBe(0);
  });

  test("should fail without title", async () => {
    const res = await request(app).post("/api/notifications").send({ message: "No title" }).set("Authorization", `Bearer ${token}`);
    expect(res.body.error).toBeTruthy();
  });
});

describe("GET /api/notifications", () => {
  test("should list notifications for recipient", async () => {
    await request(app).post("/api/notifications").send({ title: "N1", recipient_email: "a@test.com" }).set("Authorization", `Bearer ${token}`);
    await request(app).post("/api/notifications").send({ title: "N2", recipient_email: "b@test.com" }).set("Authorization", `Bearer ${token}`);
    const res = await request(app).get("/api/notifications?recipient_email=a@test.com").set("Authorization", `Bearer ${token}`);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].title).toBe("N1");
  });

  test("should filter unread only", async () => {
    const create1 = await request(app).post("/api/notifications").send({ title: "Read", recipient_email: "u@test.com" }).set("Authorization", `Bearer ${token}`);
    await request(app).post("/api/notifications").send({ title: "Unread", recipient_email: "u@test.com" }).set("Authorization", `Bearer ${token}`);
    // Mark first as read
    await request(app).put(`/api/notifications/${create1.body.data.id}/read`).set("Authorization", `Bearer ${token}`);
    const res = await request(app).get("/api/notifications?recipient_email=u@test.com&unread_only=true").set("Authorization", `Bearer ${token}`);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].title).toBe("Unread");
  });
});

describe("PUT /api/notifications/:id/read", () => {
  test("should mark notification as read", async () => {
    const createRes = await request(app).post("/api/notifications").send({ title: "MarkMe" }).set("Authorization", `Bearer ${token}`);
    const res = await request(app).put(`/api/notifications/${createRes.body.data.id}/read`).set("Authorization", `Bearer ${token}`);
    expect(res.body.data.is_read).toBe(1);
  });
});

describe("DELETE /api/notifications/:id", () => {
  test("should delete a notification", async () => {
    const createRes = await request(app).post("/api/notifications").send({ title: "DelMe", recipient_email: "del@test.com" }).set("Authorization", `Bearer ${token}`);
    const id = createRes.body.data.id;
    await request(app).delete(`/api/notifications/${id}`).set("Authorization", `Bearer ${token}`);
    // Verify it's gone
    const check = await request(app).get("/api/notifications?recipient_email=del@test.com").set("Authorization", `Bearer ${token}`);
    expect(check.body.data.length).toBe(0);
  });
});

describe("POST /api/notifications/broadcast", () => {
  test("should broadcast to specific emails", async () => {
    const res = await request(app).post("/api/notifications/broadcast").send({
      title: "Broadcast Test",
      message: "Hello everyone",
      recipient_emails: ["a@test.com", "b@test.com"],
    }).set("Authorization", `Bearer ${token}`);
    expect(res.body.data.count).toBe(2);
    expect(res.body.data.ids).toHaveLength(2);
  });

  test("should broadcast to a role", async () => {
    await createTestUser({ email: "v1@test.com", user_type: "volunteer" });
    await createTestUser({ email: "v2@test.com", user_type: "volunteer" });
    await createTestUser({ email: "d1@test.com", user_type: "donor" });
    const res = await request(app).post("/api/notifications/broadcast").send({
      title: "Vol Broadcast",
      recipient_role: "volunteer",
    }).set("Authorization", `Bearer ${token}`);
    expect(res.body.data.count).toBe(2);
  });
});
