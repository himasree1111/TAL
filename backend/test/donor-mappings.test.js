const request = require("supertest");
const { app, createTestStudent, cleanupTables } = require("./helpers");

beforeEach(async () => {
  await cleanupTables();
});

describe("POST /api/donor-mappings", () => {
  test("should create a donor mapping", async () => {
    const student = await createTestStudent();
    const res = await request(app).post("/api/donor-mappings").send({
      student_id: student.id,
      donor_name: "John Donor",
      donor_email: "john@donor.com",
      amount: 25000,
    });
    expect(res.body.error).toBeNull();
    expect(res.body.data.donor_name).toBe("John Donor");
    expect(res.body.data.student_id).toBe(student.id);
  });

  test("should fail without required fields", async () => {
    const res = await request(app).post("/api/donor-mappings").send({ donor_name: "NoStudent" });
    expect(res.body.error).toBeTruthy();
  });
});

describe("GET /api/donor-mappings", () => {
  test("should list all mappings with student_name join", async () => {
    const student = await createTestStudent({ first_name: "Alice", last_name: "Smith" });
    await request(app).post("/api/donor-mappings").send({ student_id: student.id, donor_name: "Donor1" });
    const res = await request(app).get("/api/donor-mappings");
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].student_name).toContain("Alice");
  });

  test("should filter by donor_email", async () => {
    const student = await createTestStudent();
    await request(app).post("/api/donor-mappings").send({ student_id: student.id, donor_name: "D1", donor_email: "d1@test.com" });
    await request(app).post("/api/donor-mappings").send({ student_id: student.id, donor_name: "D2", donor_email: "d2@test.com" });
    const res = await request(app).get("/api/donor-mappings?donor_email=d1@test.com");
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].donor_email).toBe("d1@test.com");
  });
});

describe("PUT /api/donor-mappings/:id", () => {
  test("should update a mapping", async () => {
    const student = await createTestStudent();
    const createRes = await request(app).post("/api/donor-mappings").send({ student_id: student.id, donor_name: "Old" });
    const res = await request(app).put(`/api/donor-mappings/${createRes.body.data.id}`).send({ donor_name: "New" });
    expect(res.body.data.donor_name).toBe("New");
  });
});

describe("DELETE /api/donor-mappings/:id", () => {
  test("should delete a mapping", async () => {
    const student = await createTestStudent();
    const createRes = await request(app).post("/api/donor-mappings").send({ student_id: student.id, donor_name: "Del" });
    const res = await request(app).delete(`/api/donor-mappings/${createRes.body.data.id}`);
    expect(res.body.error).toBeNull();
  });
});
