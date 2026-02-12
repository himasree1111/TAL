const request = require("supertest");
const { app, db, createTestStudent, cleanupTables } = require("./helpers");

beforeEach(async () => {
  await cleanupTables();
});

describe("GET /api/students/available-for-adoption", () => {
  test("should return students without a current sponsor", async () => {
    const s1 = await createTestStudent({ first_name: "Sponsored", status: "eligible" });
    const s2 = await createTestStudent({ first_name: "Available", status: "eligible" });
    // Sponsor s1
    await request(app).post("/api/donor-mappings").send({
      student_id: s1.id,
      donor_name: "Donor A",
      is_current_sponsor: 1,
    });
    const res = await request(app).get("/api/students/available-for-adoption");
    expect(res.body.error).toBeNull();
    const ids = res.body.data.map(s => s.id);
    expect(ids).not.toContain(s1.id);
    expect(ids).toContain(s2.id);
  });

  test("should return empty list when all are sponsored", async () => {
    const s1 = await createTestStudent({ status: "eligible" });
    await request(app).post("/api/donor-mappings").send({
      student_id: s1.id,
      donor_name: "Full Donor",
      is_current_sponsor: 1,
    });
    const res = await request(app).get("/api/students/available-for-adoption");
    expect(res.body.data.length).toBe(0);
  });

  test("should include students with past (non-current) sponsors", async () => {
    const s1 = await createTestStudent({ status: "eligible" });
    await request(app).post("/api/donor-mappings").send({
      student_id: s1.id,
      donor_name: "Past Donor",
      is_current_sponsor: 0,
    });
    const res = await request(app).get("/api/students/available-for-adoption");
    expect(res.body.data.length).toBe(1);
  });
});
