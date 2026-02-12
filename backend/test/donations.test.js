const request = require("supertest");
const { app, createTestStudent, cleanupTables } = require("./helpers");

beforeEach(async () => {
  await cleanupTables();
});

describe("POST /api/donations", () => {
  test("should create a donation", async () => {
    const res = await request(app).post("/api/donations").send({
      donor_name: "John",
      donor_email: "john@test.com",
      amount: 10000,
      payment_date: "2024-06-15",
    });
    expect(res.body.error).toBeNull();
    expect(res.body.data.amount).toBe(10000);
    expect(res.body.data.receipt_number).toBeTruthy();
  });

  test("should fail without required fields", async () => {
    const res = await request(app).post("/api/donations").send({ donor_name: "NoAmount" });
    expect(res.body.error).toBeTruthy();
    expect(res.body.error.message).toMatch(/required/i);
  });

  test("should link donation to student", async () => {
    const student = await createTestStudent();
    const res = await request(app).post("/api/donations").send({
      donor_name: "Jane",
      student_id: student.id,
      amount: 5000,
      payment_date: "2024-06-15",
    });
    expect(res.body.data.student_id).toBe(student.id);
  });
});

describe("GET /api/donations", () => {
  test("should list all donations with student_name", async () => {
    const student = await createTestStudent({ first_name: "Bob", last_name: "Lee" });
    await request(app).post("/api/donations").send({ donor_name: "D1", student_id: student.id, amount: 100, payment_date: "2024-01-01" });
    const res = await request(app).get("/api/donations");
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].student_name).toContain("Bob");
  });

  test("should filter by donor_email", async () => {
    await request(app).post("/api/donations").send({ donor_email: "a@test.com", amount: 100, payment_date: "2024-01-01" });
    await request(app).post("/api/donations").send({ donor_email: "b@test.com", amount: 200, payment_date: "2024-01-01" });
    const res = await request(app).get("/api/donations?donor_email=a@test.com");
    expect(res.body.data.length).toBe(1);
  });
});

describe("DELETE /api/donations/:id", () => {
  test("should delete a donation", async () => {
    const createRes = await request(app).post("/api/donations").send({ amount: 100, payment_date: "2024-01-01" });
    const res = await request(app).delete(`/api/donations/${createRes.body.data.id}`);
    expect(res.body.error).toBeNull();
  });
});

describe("GET /api/donations/summary", () => {
  test("should return donation summary", async () => {
    await request(app).post("/api/donations").send({ donor_name: "D1", donor_email: "d1@t.com", amount: 5000, payment_date: "2024-01-15" });
    await request(app).post("/api/donations").send({ donor_name: "D1", donor_email: "d1@t.com", amount: 3000, payment_date: "2024-02-15" });
    await request(app).post("/api/donations").send({ donor_name: "D2", donor_email: "d2@t.com", amount: 2000, payment_date: "2024-01-20" });

    const res = await request(app).get("/api/donations/summary");
    expect(res.body.error).toBeNull();
    expect(res.body.data.total).toBe(10000);
    expect(res.body.data.byDonor.length).toBe(2);
    expect(res.body.data.byMonth.length).toBeGreaterThanOrEqual(1);
  });

  test("should filter by date range", async () => {
    await request(app).post("/api/donations").send({ donor_name: "D1", donor_email: "d1@t.com", amount: 5000, payment_date: "2024-01-15" });
    await request(app).post("/api/donations").send({ donor_name: "D1", donor_email: "d1@t.com", amount: 3000, payment_date: "2024-03-15" });

    // Only Jan
    const res = await request(app).get("/api/donations/summary?start_date=2024-01-01&end_date=2024-01-31");
    expect(res.body.data.total).toBe(5000);
    expect(res.body.data.byDonor.length).toBe(1);

    // Only March
    const res2 = await request(app).get("/api/donations/summary?start_date=2024-03-01&end_date=2024-03-31");
    expect(res2.body.data.total).toBe(3000);
  });
});
