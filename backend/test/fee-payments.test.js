const request = require("supertest");
const { app, createTestStudent, cleanupTables } = require("./helpers");

beforeEach(async () => {
  await cleanupTables();
});

describe("POST /api/fee-payments", () => {
  test("should create a fee payment", async () => {
    const student = await createTestStudent();
    const res = await request(app).post("/api/fee-payments").send({
      student_id: student.id,
      amount: 5000,
      payment_date: "2024-01-15",
    });
    expect(res.body.error).toBeNull();
    expect(res.body.data.amount).toBe(5000);
    expect(res.body.data.student_id).toBe(student.id);
  });

  test("should fail with missing required fields", async () => {
    const res = await request(app).post("/api/fee-payments").send({ amount: 100 });
    expect(res.body.error).toBeTruthy();
    expect(res.body.error.message).toMatch(/required/i);
  });
});

describe("GET /api/fee-payments", () => {
  test("should list all payments", async () => {
    const student = await createTestStudent();
    await request(app).post("/api/fee-payments").send({ student_id: student.id, amount: 1000, payment_date: "2024-01-01" });
    await request(app).post("/api/fee-payments").send({ student_id: student.id, amount: 2000, payment_date: "2024-02-01" });
    const res = await request(app).get("/api/fee-payments");
    expect(res.body.data.length).toBe(2);
  });

  test("should filter by student_id", async () => {
    const s1 = await createTestStudent({ first_name: "S1" });
    const s2 = await createTestStudent({ first_name: "S2" });
    await request(app).post("/api/fee-payments").send({ student_id: s1.id, amount: 100, payment_date: "2024-01-01" });
    await request(app).post("/api/fee-payments").send({ student_id: s2.id, amount: 200, payment_date: "2024-01-01" });
    const res = await request(app).get(`/api/fee-payments?student_id=${s1.id}`);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].student_id).toBe(s1.id);
  });
});

describe("PUT /api/fee-payments/:id", () => {
  test("should update a payment", async () => {
    const student = await createTestStudent();
    const createRes = await request(app).post("/api/fee-payments").send({ student_id: student.id, amount: 100, payment_date: "2024-01-01" });
    const paymentId = createRes.body.data.id;
    const res = await request(app).put(`/api/fee-payments/${paymentId}`).send({ amount: 200 });
    expect(res.body.data.amount).toBe(200);
  });
});

describe("DELETE /api/fee-payments/:id", () => {
  test("should delete a payment", async () => {
    const student = await createTestStudent();
    const createRes = await request(app).post("/api/fee-payments").send({ student_id: student.id, amount: 100, payment_date: "2024-01-01" });
    const res = await request(app).delete(`/api/fee-payments/${createRes.body.data.id}`);
    expect(res.body.error).toBeNull();
  });
});

describe("GET /api/fee-payments/summary", () => {
  test("should calculate fee summary correctly", async () => {
    const student = await createTestStudent({ fee_structure: "10000" });
    await request(app).post("/api/fee-payments").send({ student_id: student.id, amount: 3000, payment_date: "2024-01-01" });
    await request(app).post("/api/fee-payments").send({ student_id: student.id, amount: 3000, payment_date: "2024-02-01" });

    const res = await request(app).get("/api/fee-payments/summary");
    expect(res.body.error).toBeNull();
    const studentSummary = res.body.data.find(s => s.student_id === student.id);
    expect(studentSummary).toBeTruthy();
    expect(studentSummary.total_paid).toBe(6000);
    expect(studentSummary.balance).toBe(4000);
    expect(studentSummary.status).toBe("partial");
  });

  test("should filter by date range", async () => {
    const student = await createTestStudent({ fee_structure: "10000" });
    await request(app).post("/api/fee-payments").send({ student_id: student.id, amount: 2000, payment_date: "2024-01-15" });
    await request(app).post("/api/fee-payments").send({ student_id: student.id, amount: 3000, payment_date: "2024-03-15" });

    // Only Jan payments
    const res = await request(app).get("/api/fee-payments/summary?start_date=2024-01-01&end_date=2024-01-31");
    expect(res.body.error).toBeNull();
    const s = res.body.data.find(r => r.student_id === student.id);
    expect(s.total_paid).toBe(2000);

    // Only March payments
    const res2 = await request(app).get("/api/fee-payments/summary?start_date=2024-03-01&end_date=2024-03-31");
    const s2 = res2.body.data.find(r => r.student_id === student.id);
    expect(s2.total_paid).toBe(3000);
  });

  test("should include study_category in summary", async () => {
    const student = await createTestStudent({ fee_structure: "10000", educationcategory: "Engineering" });
    const res = await request(app).get("/api/fee-payments/summary");
    const s = res.body.data.find(r => r.student_id === student.id);
    expect(s.study_category).toBe("Engineering");
  });
});
