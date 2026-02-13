const request = require("supertest");
const { app, createTestStudent, createAuthenticatedUser, cleanupTables } = require("./helpers");

let token;

beforeEach(async () => {
  await cleanupTables();
  const user = await createAuthenticatedUser();
  token = user.token;
});

describe("POST /api/donor-mappings", () => {
  test("should create a donor mapping", async () => {
    const student = await createTestStudent({}, token);
    const res = await request(app).post("/api/donor-mappings").send({
      student_id: student.id,
      donor_name: "John Donor",
      donor_email: "john@donor.com",
      amount: 25000,
    }).set("Authorization", `Bearer ${token}`);
    expect(res.body.error).toBeNull();
    expect(res.body.data.donor_name).toBe("John Donor");
    expect(res.body.data.student_id).toBe(student.id);
  });

  test("should fail without required fields", async () => {
    const res = await request(app).post("/api/donor-mappings").send({ donor_name: "NoStudent" }).set("Authorization", `Bearer ${token}`);
    expect(res.body.error).toBeTruthy();
  });
});

describe("GET /api/donor-mappings", () => {
  test("should list all mappings with student_name join", async () => {
    const student = await createTestStudent({ first_name: "Alice", last_name: "Smith" }, token);
    await request(app).post("/api/donor-mappings").send({ student_id: student.id, donor_name: "Donor1" }).set("Authorization", `Bearer ${token}`);
    const res = await request(app).get("/api/donor-mappings").set("Authorization", `Bearer ${token}`);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].student_name).toContain("Alice");
  });

  test("should filter by donor_email", async () => {
    const student = await createTestStudent({}, token);
    await request(app).post("/api/donor-mappings").send({ student_id: student.id, donor_name: "D1", donor_email: "d1@test.com" }).set("Authorization", `Bearer ${token}`);
    await request(app).post("/api/donor-mappings").send({ student_id: student.id, donor_name: "D2", donor_email: "d2@test.com" }).set("Authorization", `Bearer ${token}`);
    const res = await request(app).get("/api/donor-mappings?donor_email=d1@test.com").set("Authorization", `Bearer ${token}`);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].donor_email).toBe("d1@test.com");
  });
});

describe("PUT /api/donor-mappings/:id", () => {
  test("should update a mapping", async () => {
    const student = await createTestStudent({}, token);
    const createRes = await request(app).post("/api/donor-mappings").send({ student_id: student.id, donor_name: "Old" }).set("Authorization", `Bearer ${token}`);
    const res = await request(app).put(`/api/donor-mappings/${createRes.body.data.id}`).send({ donor_name: "New" }).set("Authorization", `Bearer ${token}`);
    expect(res.body.data.donor_name).toBe("New");
  });
});

describe("DELETE /api/donor-mappings/:id", () => {
  test("should delete a mapping", async () => {
    const student = await createTestStudent({}, token);
    const createRes = await request(app).post("/api/donor-mappings").send({ student_id: student.id, donor_name: "Del" }).set("Authorization", `Bearer ${token}`);
    const res = await request(app).delete(`/api/donor-mappings/${createRes.body.data.id}`).set("Authorization", `Bearer ${token}`);
    expect(res.body.error).toBeNull();
  });
});
