const request = require("supertest");
const { app, db, createTestStudent, cleanupTables } = require("./helpers");

beforeEach(async () => {
  await cleanupTables();
});

describe("POST /api/camps", () => {
  test("should create a camp", async () => {
    const res = await request(app).post("/api/camps").send({
      name: "Summer Camp 2025",
      date: "2025-06-15",
      location: "Hyderabad",
      description: "Annual summer camp",
    });
    expect(res.body.error).toBeNull();
    expect(res.body.data.name).toBe("Summer Camp 2025");
    expect(res.body.data.location).toBe("Hyderabad");
  });

  test("should fail without name", async () => {
    const res = await request(app).post("/api/camps").send({ date: "2025-06-15" });
    expect(res.body.error).toBeTruthy();
  });
});

describe("GET /api/camps", () => {
  test("should list all camps", async () => {
    await request(app).post("/api/camps").send({ name: "Camp A", date: "2025-01-01" });
    await request(app).post("/api/camps").send({ name: "Camp B", date: "2025-06-01" });
    const res = await request(app).get("/api/camps");
    expect(res.body.data.length).toBe(2);
  });
});

describe("PUT /api/camps/:id", () => {
  test("should update a camp", async () => {
    const create = await request(app).post("/api/camps").send({ name: "Old Name" });
    const id = create.body.data.id;
    const res = await request(app).put(`/api/camps/${id}`).send({ name: "New Name" });
    expect(res.body.data.name).toBe("New Name");
  });
});

describe("DELETE /api/camps/:id", () => {
  test("should delete a camp", async () => {
    const create = await request(app).post("/api/camps").send({ name: "Temp Camp" });
    const id = create.body.data.id;
    await request(app).delete(`/api/camps/${id}`);
    const list = await request(app).get("/api/camps");
    expect(list.body.data.length).toBe(0);
  });
});

describe("POST /api/camp-participation", () => {
  test("should register student for a camp", async () => {
    const student = await createTestStudent();
    const camp = (await request(app).post("/api/camps").send({ name: "Test Camp" })).body.data;
    const res = await request(app).post("/api/camp-participation").send({
      student_id: student.id,
      camp_id: camp.id,
      status: "registered",
    });
    expect(res.body.error).toBeNull();
    expect(res.body.data.student_id).toBe(student.id);
    expect(res.body.data.camp_id).toBe(camp.id);
  });

  test("should prevent duplicate registration", async () => {
    const student = await createTestStudent();
    const camp = (await request(app).post("/api/camps").send({ name: "Camp X" })).body.data;
    await request(app).post("/api/camp-participation").send({ student_id: student.id, camp_id: camp.id });
    const res = await request(app).post("/api/camp-participation").send({ student_id: student.id, camp_id: camp.id });
    expect(res.body.error).toBeTruthy();
    expect(res.body.error.message).toContain("already registered");
  });
});

describe("GET /api/camp-participation", () => {
  test("should list with camp and student details", async () => {
    const student = await createTestStudent();
    const camp = (await request(app).post("/api/camps").send({ name: "Detail Camp", location: "City" })).body.data;
    await request(app).post("/api/camp-participation").send({ student_id: student.id, camp_id: camp.id });
    const res = await request(app).get(`/api/camp-participation?student_id=${student.id}`);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].camp_name).toBe("Detail Camp");
    expect(res.body.data[0].student_name).toBeTruthy();
  });
});

describe("PUT /api/camp-participation/:id", () => {
  test("should update participation status", async () => {
    const student = await createTestStudent();
    const camp = (await request(app).post("/api/camps").send({ name: "Update Camp" })).body.data;
    const create = await request(app).post("/api/camp-participation").send({ student_id: student.id, camp_id: camp.id });
    const id = create.body.data.id;
    const res = await request(app).put(`/api/camp-participation/${id}`).send({ status: "attended" });
    expect(res.body.data.status).toBe("attended");
  });
});
