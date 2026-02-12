const request = require("supertest");
const { app, db, createTestStudent, cleanupTables } = require("./helpers");

beforeEach(async () => {
  await cleanupTables();
});

describe("POST /api/fee-structures", () => {
  test("should create a fee structure for a student", async () => {
    const student = await createTestStudent();
    const res = await request(app).post("/api/fee-structures").send({
      student_id: student.id,
      total_fee: 60000,
      num_terms: 3,
      term_fees: [
        { term: 1, amount: 20000, due_date: "2025-06-01", label: "Term 1" },
        { term: 2, amount: 20000, due_date: "2025-10-01", label: "Term 2" },
        { term: 3, amount: 20000, due_date: "2026-02-01", label: "Term 3" },
      ],
      academic_year: "2025-26",
    });
    expect(res.body.error).toBeNull();
    expect(res.body.data.student_id).toBe(student.id);
    expect(res.body.data.total_fee).toBe(60000);
    expect(res.body.data.num_terms).toBe(3);
    expect(res.body.data.term_fees).toHaveLength(3);
    expect(res.body.data.term_fees[0].amount).toBe(20000);
    expect(res.body.data.academic_year).toBe("2025-26");
  });

  test("should fail without required fields", async () => {
    const res = await request(app).post("/api/fee-structures").send({});
    expect(res.body.error).toBeTruthy();
  });

  test("should upsert on conflict (same student_id)", async () => {
    const student = await createTestStudent();
    await request(app).post("/api/fee-structures").send({
      student_id: student.id,
      total_fee: 50000,
      num_terms: 2,
    });
    const res = await request(app).post("/api/fee-structures").send({
      student_id: student.id,
      total_fee: 70000,
      num_terms: 4,
    });
    expect(res.body.error).toBeNull();
    expect(res.body.data.total_fee).toBe(70000);
    expect(res.body.data.num_terms).toBe(4);
    // Should still be one record
    const all = await request(app).get("/api/fee-structures");
    expect(all.body.data).toHaveLength(1);
  });
});

describe("GET /api/fee-structures", () => {
  test("should list all fee structures with student_name", async () => {
    const s1 = await createTestStudent({ first_name: "Alice", last_name: "A" });
    const s2 = await createTestStudent({ first_name: "Bob", last_name: "B" });
    await request(app).post("/api/fee-structures").send({ student_id: s1.id, total_fee: 30000 });
    await request(app).post("/api/fee-structures").send({ student_id: s2.id, total_fee: 40000 });
    const res = await request(app).get("/api/fee-structures");
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].student_name).toBeTruthy();
  });

  test("should filter by student_id", async () => {
    const student = await createTestStudent();
    await request(app).post("/api/fee-structures").send({ student_id: student.id, total_fee: 50000, num_terms: 2 });
    const res = await request(app).get(`/api/fee-structures?student_id=${student.id}`);
    expect(res.body.data.student_id).toBe(student.id);
    expect(res.body.data.total_fee).toBe(50000);
  });

  test("should return null for non-existent student", async () => {
    const res = await request(app).get("/api/fee-structures?student_id=9999");
    expect(res.body.data).toBeNull();
  });
});

describe("PUT /api/fee-structures/:id", () => {
  test("should update a fee structure", async () => {
    const student = await createTestStudent();
    const create = await request(app).post("/api/fee-structures").send({ student_id: student.id, total_fee: 50000 });
    const id = create.body.data.id;
    const res = await request(app).put(`/api/fee-structures/${id}`).send({
      total_fee: 75000,
      num_terms: 3,
      term_fees: [
        { term: 1, amount: 25000 },
        { term: 2, amount: 25000 },
        { term: 3, amount: 25000 },
      ],
    });
    expect(res.body.data.total_fee).toBe(75000);
    expect(res.body.data.num_terms).toBe(3);
    expect(res.body.data.term_fees).toHaveLength(3);
  });
});

describe("DELETE /api/fee-structures/:id", () => {
  test("should delete a fee structure", async () => {
    const student = await createTestStudent();
    const create = await request(app).post("/api/fee-structures").send({ student_id: student.id, total_fee: 50000 });
    const id = create.body.data.id;
    const res = await request(app).delete(`/api/fee-structures/${id}`);
    expect(res.body.error).toBeNull();
    const check = await request(app).get(`/api/fee-structures?student_id=${student.id}`);
    expect(check.body.data).toBeNull();
  });
});
