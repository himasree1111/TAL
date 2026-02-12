const request = require("supertest");
const { app, db, ensureInit } = require("./setup");

async function createTestUser(overrides = {}) {
  await ensureInit();
  const userData = {
    email: overrides.email || `test_${Date.now()}@example.com`,
    password: overrides.password || "TestPass1!",
    options: {
      data: {
        name: overrides.name || "Test User",
        user_type: overrides.user_type || "volunteer",
      },
    },
  };

  const res = await request(app).post("/api/auth/signup").send(userData);
  return { ...res.body, email: userData.email, password: userData.password };
}

async function getAuthToken(email, password) {
  await ensureInit();
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email, password });
  return res.body.data?.session?.access_token;
}

async function createTestStudent(overrides = {}) {
  await ensureInit();
  const payload = {
    first_name: overrides.first_name || "Test",
    last_name: overrides.last_name || "Student",
    email: overrides.email || `student_${Date.now()}@example.com`,
    volunteer_email: overrides.volunteer_email || "volunteer@test.com",
    age: overrides.age || 18,
    school: overrides.school || "Test School",
    class: overrides.class || "10th",
    fee_structure: overrides.fee_structure || "50000",
    contact: overrides.contact || "9876543210",
    whatsapp: overrides.whatsapp || "9876543210",
    address: overrides.address || "Test Address",
    status: overrides.status || "pending",
    ...overrides,
  };

  const res = await request(app).post("/api/student-forms").send(payload);
  return res.body.data?.[0] || res.body.data;
}

async function cleanupTables() {
  await ensureInit();
  await db.exec("DELETE FROM academic_records");
  await db.exec("DELETE FROM camp_participation");
  await db.exec("DELETE FROM camps");
  await db.exec("DELETE FROM donations");
  await db.exec("DELETE FROM notifications");
  await db.exec("DELETE FROM donor_mapping");
  await db.exec("DELETE FROM fee_payments");
  await db.exec("DELETE FROM fee_structures");
  await db.exec("DELETE FROM documents");
  await db.exec("DELETE FROM student_form_submissions");
  await db.exec("DELETE FROM users");
}

module.exports = { app, db, createTestUser, getAuthToken, createTestStudent, cleanupTables };
