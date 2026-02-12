const request = require("supertest");
const { app, db, createTestStudent, cleanupTables } = require("./helpers");

beforeEach(async () => {
  await cleanupTables();
});

describe("POST /api/student-forms", () => {
  test("should create a student form", async () => {
    const res = await request(app).post("/api/student-forms").send({
      first_name: "Alice",
      last_name: "Smith",
      email: "alice@test.com",
      age: 18,
      school: "Test School",
      class: "12th",
      fee_structure: "50000",
    });
    expect(res.body.error).toBeNull();
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].first_name).toBe("Alice");
    expect(res.body.data[0].id).toBeTruthy();
  });

  test("should handle boolean fields (is_single_parent, does_work, has_scholarship)", async () => {
    const res = await request(app).post("/api/student-forms").send({
      first_name: "Bool",
      last_name: "Test",
      is_single_parent: true,
      does_work: false,
      has_scholarship: true,
    });
    expect(res.body.data[0].is_single_parent).toBe(true);
    expect(res.body.data[0].does_work).toBe(false);
    expect(res.body.data[0].has_scholarship).toBe(true);
  });

  test("should handle JSON array fields", async () => {
    const family = [{ name: "Parent", relation: "Father" }];
    const res = await request(app).post("/api/student-forms").send({
      first_name: "JSON",
      last_name: "Test",
      family_members_details: family,
    });
    expect(res.body.data[0].family_members_details).toEqual(family);
  });

  test("should store and return family/income fields", async () => {
    const res = await request(app).post("/api/student-forms").send({
      first_name: "Family",
      last_name: "Fields",
      father_name: "Dad",
      mother_name: "Mom",
      guardian_name: "Uncle",
      head_of_family: "Dad",
      income_source: "Agriculture",
      monthly_income: 15000,
      num_dependents: 4,
      school_address: "123 School St",
    });
    expect(res.body.error).toBeNull();
    const s = res.body.data[0];
    expect(s.father_name).toBe("Dad");
    expect(s.mother_name).toBe("Mom");
    expect(s.guardian_name).toBe("Uncle");
    expect(s.head_of_family).toBe("Dad");
    expect(s.income_source).toBe("Agriculture");
    expect(s.monthly_income).toBe(15000);
    expect(s.num_dependents).toBe(4);
    expect(s.school_address).toBe("123 School St");
  });
});

describe("GET /api/student-forms", () => {
  test("should list all forms", async () => {
    await createTestStudent({ first_name: "A" });
    await createTestStudent({ first_name: "B" });
    const res = await request(app).get("/api/student-forms");
    expect(res.body.data.length).toBe(2);
  });

  test("should filter by volunteer_email", async () => {
    await createTestStudent({ volunteer_email: "vol1@test.com" });
    await createTestStudent({ volunteer_email: "vol2@test.com" });
    const res = await request(app).get("/api/student-forms?volunteer_email=vol1@test.com");
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].volunteer_email).toBe("vol1@test.com");
  });

  test("should return single form by id", async () => {
    const student = await createTestStudent();
    const res = await request(app).get(`/api/student-forms?id=${student.id}&single=true`);
    expect(res.body.data.id).toBe(student.id);
  });

  test("should order by field", async () => {
    await createTestStudent({ first_name: "Zebra" });
    await createTestStudent({ first_name: "Alpha" });
    const res = await request(app).get("/api/student-forms?order_field=first_name&order_ascending=true");
    expect(res.body.data[0].first_name).toBe("Alpha");
  });
});

describe("PUT /api/student-forms/:id", () => {
  test("should update a form", async () => {
    const student = await createTestStudent({ first_name: "Old" });
    const res = await request(app)
      .put(`/api/student-forms/${student.id}`)
      .send({ first_name: "New" });
    expect(res.body.data.first_name).toBe("New");
  });
});

describe("DELETE /api/student-forms/:id", () => {
  test("should delete a form", async () => {
    const student = await createTestStudent();
    const res = await request(app).delete(`/api/student-forms/${student.id}`);
    expect(res.body.error).toBeNull();
    const check = await request(app).get(`/api/student-forms?id=${student.id}&single=true`);
    expect(check.body.data).toBeFalsy();
  });
});
