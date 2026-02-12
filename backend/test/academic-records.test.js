const request = require("supertest");
const { app, db, createTestStudent, cleanupTables } = require("./helpers");

beforeEach(async () => {
  await cleanupTables();
});

describe("POST /api/academic-records", () => {
  test("should create an academic record", async () => {
    const student = await createTestStudent();
    const res = await request(app).post("/api/academic-records").send({
      student_id: student.id,
      academic_year: "2024-25",
      semester: "Sem 1",
      subject_name: "Mathematics",
      marks_obtained: 85,
      max_marks: 100,
      grade: "A",
    });
    expect(res.body.error).toBeNull();
    expect(res.body.data.subject_name).toBe("Mathematics");
    expect(res.body.data.marks_obtained).toBe(85);
    expect(res.body.data.grade).toBe("A");
  });

  test("should fail without student_id or subject_name", async () => {
    const res = await request(app).post("/api/academic-records").send({ marks_obtained: 90 });
    expect(res.body.error).toBeTruthy();
  });
});

describe("GET /api/academic-records", () => {
  test("should list all records with student name", async () => {
    const student = await createTestStudent();
    await request(app).post("/api/academic-records").send({ student_id: student.id, subject_name: "Physics", marks_obtained: 78 });
    await request(app).post("/api/academic-records").send({ student_id: student.id, subject_name: "Chemistry", marks_obtained: 82 });
    const res = await request(app).get("/api/academic-records");
    expect(res.body.data.length).toBe(2);
    expect(res.body.data[0].student_name).toBeTruthy();
  });

  test("should filter by student_id", async () => {
    const s1 = await createTestStudent({ first_name: "S1" });
    const s2 = await createTestStudent({ first_name: "S2" });
    await request(app).post("/api/academic-records").send({ student_id: s1.id, subject_name: "Math" });
    await request(app).post("/api/academic-records").send({ student_id: s2.id, subject_name: "Science" });
    const res = await request(app).get(`/api/academic-records?student_id=${s1.id}`);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].subject_name).toBe("Math");
  });
});

describe("PUT /api/academic-records/:id", () => {
  test("should update marks and grade", async () => {
    const student = await createTestStudent();
    const create = await request(app).post("/api/academic-records").send({ student_id: student.id, subject_name: "English", marks_obtained: 70 });
    const id = create.body.data.id;
    const res = await request(app).put(`/api/academic-records/${id}`).send({ marks_obtained: 88, grade: "A+" });
    expect(res.body.data.marks_obtained).toBe(88);
    expect(res.body.data.grade).toBe("A+");
  });
});

describe("DELETE /api/academic-records/:id", () => {
  test("should delete a record", async () => {
    const student = await createTestStudent();
    const create = await request(app).post("/api/academic-records").send({ student_id: student.id, subject_name: "Hindi" });
    const id = create.body.data.id;
    await request(app).delete(`/api/academic-records/${id}`);
    const list = await request(app).get(`/api/academic-records?student_id=${student.id}`);
    expect(list.body.data.length).toBe(0);
  });
});
