const request = require("supertest");
const { app, db, createTestStudent, createAuthenticatedUser, cleanupTables } = require("./helpers");

let token;

beforeEach(async () => {
  await cleanupTables();
  const user = await createAuthenticatedUser();
  token = user.token;
});

describe("POST /api/academic-records", () => {
  test("should create an academic record", async () => {
    const student = await createTestStudent({}, token);
    const res = await request(app).post("/api/academic-records").send({
      student_id: student.id,
      academic_year: "2024-25",
      semester: "Sem 1",
      subject_name: "Mathematics",
      marks_obtained: 85,
      max_marks: 100,
      grade: "A",
    }).set("Authorization", `Bearer ${token}`);
    expect(res.body.error).toBeNull();
    expect(res.body.data.subject_name).toBe("Mathematics");
    expect(res.body.data.marks_obtained).toBe(85);
    expect(res.body.data.grade).toBe("A");
  });

  test("should fail without student_id or subject_name", async () => {
    const res = await request(app).post("/api/academic-records").send({ marks_obtained: 90 }).set("Authorization", `Bearer ${token}`);
    expect(res.body.error).toBeTruthy();
  });
});

describe("GET /api/academic-records", () => {
  test("should list all records with student name", async () => {
    const student = await createTestStudent({}, token);
    await request(app).post("/api/academic-records").send({ student_id: student.id, subject_name: "Physics", marks_obtained: 78 }).set("Authorization", `Bearer ${token}`);
    await request(app).post("/api/academic-records").send({ student_id: student.id, subject_name: "Chemistry", marks_obtained: 82 }).set("Authorization", `Bearer ${token}`);
    const res = await request(app).get("/api/academic-records").set("Authorization", `Bearer ${token}`);
    expect(res.body.data.length).toBe(2);
    expect(res.body.data[0].student_name).toBeTruthy();
  });

  test("should filter by student_id", async () => {
    const s1 = await createTestStudent({ first_name: "S1" }, token);
    const s2 = await createTestStudent({ first_name: "S2" }, token);
    await request(app).post("/api/academic-records").send({ student_id: s1.id, subject_name: "Math" }).set("Authorization", `Bearer ${token}`);
    await request(app).post("/api/academic-records").send({ student_id: s2.id, subject_name: "Science" }).set("Authorization", `Bearer ${token}`);
    const res = await request(app).get(`/api/academic-records?student_id=${s1.id}`).set("Authorization", `Bearer ${token}`);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].subject_name).toBe("Math");
  });
});

describe("PUT /api/academic-records/:id", () => {
  test("should update marks and grade", async () => {
    const student = await createTestStudent({}, token);
    const create = await request(app).post("/api/academic-records").send({ student_id: student.id, subject_name: "English", marks_obtained: 70 }).set("Authorization", `Bearer ${token}`);
    const id = create.body.data.id;
    const res = await request(app).put(`/api/academic-records/${id}`).send({ marks_obtained: 88, grade: "A+" }).set("Authorization", `Bearer ${token}`);
    expect(res.body.data.marks_obtained).toBe(88);
    expect(res.body.data.grade).toBe("A+");
  });
});

describe("DELETE /api/academic-records/:id", () => {
  test("should delete a record", async () => {
    const student = await createTestStudent({}, token);
    const create = await request(app).post("/api/academic-records").send({ student_id: student.id, subject_name: "Hindi" }).set("Authorization", `Bearer ${token}`);
    const id = create.body.data.id;
    await request(app).delete(`/api/academic-records/${id}`).set("Authorization", `Bearer ${token}`);
    const list = await request(app).get(`/api/academic-records?student_id=${student.id}`).set("Authorization", `Bearer ${token}`);
    expect(list.body.data.length).toBe(0);
  });
});
