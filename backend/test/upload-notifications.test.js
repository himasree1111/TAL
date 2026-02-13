const request = require("supertest");
const path = require("path");
const fs = require("fs");
const { app, db, createTestStudent, createAuthenticatedUser, cleanupTables } = require("./helpers");

let token;

beforeEach(async () => {
  await cleanupTables();
  const user = await createAuthenticatedUser();
  token = user.token;
});

const tmpFile = path.join(__dirname, "test-notif-upload.pdf");
beforeAll(() => {
  fs.writeFileSync(tmpFile, "%PDF-1.0\nnotification test content");
});
afterAll(() => {
  if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
});

describe("Document upload notifications", () => {
  test("student upload should create notification for admin role", async () => {
    const student = await createTestStudent({ email: "student@test.com" }, token);
    await request(app)
      .post("/api/documents")
      .set("Authorization", `Bearer ${token}`)
      .field("student_id", student.id.toString())
      .field("uploaded_by", "student@test.com")
      .field("category", "student_upload")
      .attach("file", tmpFile);
    // Check notifications table for admin-targeted notification
    const notifs = await db.prepare("SELECT * FROM notifications WHERE recipient_role = 'admin'").all();
    expect(notifs.length).toBe(1);
    expect(notifs[0].title).toBe("New Document Upload");
    expect(notifs[0].created_by).toBe("student@test.com");
  });

  test("admin upload should create notification for student email", async () => {
    const student = await createTestStudent({ email: "student2@test.com" }, token);
    await request(app)
      .post("/api/documents")
      .set("Authorization", `Bearer ${token}`)
      .field("student_id", student.id.toString())
      .field("uploaded_by", "admin@test.com")
      .field("category", "admin_upload")
      .attach("file", tmpFile);
    const notifs = await db.prepare("SELECT * FROM notifications WHERE recipient_email = 'student2@test.com'").all();
    expect(notifs.length).toBe(1);
    expect(notifs[0].title).toBe("New Document Added");
    expect(notifs[0].created_by).toBe("admin@test.com");
  });
});
