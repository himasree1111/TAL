const request = require("supertest");
const { app, createTestStudent, createAuthenticatedUser, cleanupTables } = require("./helpers");

let token;

beforeEach(async () => {
  await cleanupTables();
  const adminUser = await createAuthenticatedUser({ user_type: "admin" });
  token = adminUser.token;
});

describe("GET /api/admin/students", () => {
  test("should list all students", async () => {
    await createTestStudent({ first_name: "A" }, token);
    await createTestStudent({ first_name: "B" }, token);
    const res = await request(app).get("/api/admin/students").set("Authorization", `Bearer ${token}`);
    expect(res.body.data.length).toBe(2);
  });

  test("should support ordering", async () => {
    await createTestStudent({ first_name: "Zara" }, token);
    await createTestStudent({ first_name: "Ana" }, token);
    const res = await request(app).get("/api/admin/students?order_field=first_name&order_ascending=true").set("Authorization", `Bearer ${token}`);
    expect(res.body.data[0].first_name).toBe("Ana");
  });
});

describe("PUT /api/admin/students/:id", () => {
  test("should update student status", async () => {
    const student = await createTestStudent({ status: "pending" }, token);
    const res = await request(app)
      .put(`/api/admin/students/${student.id}`)
      .send({ status: "eligible" })
      .set("Authorization", `Bearer ${token}`);
    expect(res.body.data.status).toBe("eligible");
  });
});

describe("GET /api/admin/eligible", () => {
  test("should return only eligible students", async () => {
    await createTestStudent({ status: "eligible" }, token);
    await createTestStudent({ status: "pending" }, token);
    const res = await request(app).get("/api/admin/eligible").set("Authorization", `Bearer ${token}`);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].status).toBe("eligible");
  });

  test("should support count_only mode", async () => {
    await createTestStudent({ status: "eligible" }, token);
    await createTestStudent({ status: "eligible" }, token);
    const res = await request(app).get("/api/admin/eligible?count_only=true").set("Authorization", `Bearer ${token}`);
    expect(res.body.count).toBe(2);
  });
});

describe("GET /api/admin/non-eligible", () => {
  test("should return only non-eligible students", async () => {
    await createTestStudent({ status: "non_eligible" }, token);
    await createTestStudent({ status: "pending" }, token);
    const res = await request(app).get("/api/admin/non-eligible").set("Authorization", `Bearer ${token}`);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].status).toBe("non_eligible");
  });

  test("should support count_only mode", async () => {
    await createTestStudent({ status: "non_eligible" }, token);
    const res = await request(app).get("/api/admin/non-eligible?count_only=true").set("Authorization", `Bearer ${token}`);
    expect(res.body.count).toBe(1);
  });
});
