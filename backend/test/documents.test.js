const request = require("supertest");
const path = require("path");
const fs = require("fs");
const { app, db, createTestStudent, cleanupTables } = require("./helpers");

beforeEach(async () => {
  await cleanupTables();
});

// Create a small temp file for upload testing
const tmpFile = path.join(__dirname, "test-upload.txt");
beforeAll(() => {
  fs.writeFileSync(tmpFile, "test file content");
});
afterAll(() => {
  if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
});

describe("POST /api/documents", () => {
  test("should upload a document and store metadata", async () => {
    const student = await createTestStudent();
    const res = await request(app)
      .post("/api/documents")
      .field("student_id", student.id.toString())
      .field("uploaded_by", "admin@test.com")
      .field("category", "fee_receipt")
      .attach("file", tmpFile);
    expect(res.body.error).toBeNull();
    expect(res.body.data.student_id).toBe(student.id);
    expect(res.body.data.file_name).toBe("test-upload.txt");
    expect(res.body.data.file_url).toContain("uploads");
    expect(res.body.data.category).toBe("fee_receipt");
  });

  test("should fail without a file", async () => {
    const res = await request(app).post("/api/documents");
    expect(res.body.error).toBeTruthy();
  });
});

describe("GET /api/documents", () => {
  test("should list all documents", async () => {
    const student = await createTestStudent();
    await request(app)
      .post("/api/documents")
      .field("student_id", student.id.toString())
      .attach("file", tmpFile);
    const res = await request(app).get("/api/documents");
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].student_name).toBeTruthy();
  });

  test("should filter by student_id", async () => {
    const s1 = await createTestStudent({ first_name: "S1" });
    const s2 = await createTestStudent({ first_name: "S2" });
    await request(app).post("/api/documents").field("student_id", s1.id.toString()).attach("file", tmpFile);
    await request(app).post("/api/documents").field("student_id", s2.id.toString()).attach("file", tmpFile);
    const res = await request(app).get(`/api/documents?student_id=${s1.id}`);
    expect(res.body.data.length).toBe(1);
  });
});

describe("DELETE /api/documents/:id", () => {
  test("should delete a document", async () => {
    const student = await createTestStudent();
    const create = await request(app)
      .post("/api/documents")
      .field("student_id", student.id.toString())
      .attach("file", tmpFile);
    const id = create.body.data.id;
    const res = await request(app).delete(`/api/documents/${id}`);
    expect(res.body.error).toBeNull();
    const check = await request(app).get(`/api/documents?student_id=${student.id}`);
    expect(check.body.data.length).toBe(0);
  });
});
