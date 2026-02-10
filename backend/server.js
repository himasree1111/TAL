const express = require("express");
const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const app = express();
const PORT = 4000;
const DB_FILE = path.join(__dirname, "app.db");
const JWT_SECRET = "tal-portal-secret-key-change-in-production";
const JWT_EXPIRY = "7d";

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use("/uploads", express.static(uploadsDir));

// Multer config for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = req.body.folder || "general";
    const dest = path.join(uploadsDir, folder);
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}_${file.originalname.replace(/\s+/g, "_")}`;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// ---------- DATABASE SETUP ----------

const db = new Database(DB_FILE);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
console.log("Connected to SQLite database");

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'volunteer',
    preferences TEXT DEFAULT '{}',
    reset_token TEXT,
    reset_token_expires INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS student_form_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    volunteer_email TEXT,
    volunteer_name TEXT,
    volunteer_contact TEXT,

    first_name TEXT,
    middle_name TEXT,
    last_name TEXT,

    dob TEXT,
    age INTEGER,
    pob TEXT,

    camp_name TEXT,
    camp_date TEXT,

    nationality TEXT,
    address TEXT,

    class TEXT,
    educationcategory TEXT,
    educationsubcategory TEXT,
    educationyear TEXT,

    school TEXT,
    branch TEXT,

    prev_percent REAL,
    present_percent REAL,

    email TEXT,
    contact TEXT,
    whatsapp TEXT,
    student_contact TEXT,

    num_family_members INTEGER DEFAULT 0,
    family_members_details TEXT DEFAULT '[]',

    earning_members INTEGER DEFAULT 0,
    earning_members_details TEXT DEFAULT '[]',

    fee TEXT,
    fee_structure TEXT,

    is_single_parent INTEGER DEFAULT 0,
    does_work INTEGER DEFAULT 0,
    job TEXT,
    has_scholarship INTEGER DEFAULT 0,
    scholarship TEXT,

    aspiration TEXT,
    academic_achievements TEXT,
    non_academic_achievements TEXT,

    years_area TEXT,

    account_no TEXT,
    bank_name TEXT,
    bank_branch TEXT,
    ifsc_code TEXT,

    special_remarks TEXT,

    school_id_url TEXT,
    aadhaar_url TEXT,
    income_proof_url TEXT,
    marksheet_url TEXT,
    passport_photo_url TEXT,
    fees_receipt_url TEXT,
    volunteer_signature_url TEXT,
    student_signature_url TEXT,

    status TEXT DEFAULT 'pending',

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// ---------- HELPERS ----------

// Create a Supabase-shaped user object from DB row
const makeUserObject = (row) => ({
  id: row.id,
  email: row.email,
  user_metadata: {
    name: row.name,
    user_type: row.role,
    contact_number: "",
    preferences: (() => {
      try { return JSON.parse(row.preferences || "{}"); } catch { return {}; }
    })(),
  },
  created_at: row.created_at,
});

// Parse JSON fields and convert booleans on read
const transformStudentRow = (row) => {
  if (!row) return row;
  const r = { ...row };
  try { r.family_members_details = JSON.parse(r.family_members_details || "[]"); } catch { r.family_members_details = []; }
  try { r.earning_members_details = JSON.parse(r.earning_members_details || "[]"); } catch { r.earning_members_details = []; }
  r.is_single_parent = !!r.is_single_parent;
  r.does_work = !!r.does_work;
  r.has_scholarship = !!r.has_scholarship;
  return r;
};

// Prepare row for insert/update (stringify JSON, convert bools)
const prepareStudentPayload = (payload) => {
  const p = { ...payload };
  if (Array.isArray(p.family_members_details)) p.family_members_details = JSON.stringify(p.family_members_details);
  if (Array.isArray(p.earning_members_details)) p.earning_members_details = JSON.stringify(p.earning_members_details);
  if (typeof p.is_single_parent === "boolean") p.is_single_parent = p.is_single_parent ? 1 : 0;
  if (typeof p.does_work === "boolean") p.does_work = p.does_work ? 1 : 0;
  if (typeof p.has_scholarship === "boolean") p.has_scholarship = p.has_scholarship ? 1 : 0;
  delete p.id;
  delete p.created_at;
  return p;
};

// ---------- AUTH ENDPOINTS ----------

// POST /api/auth/signup
app.post("/api/auth/signup", async (req, res) => {
  const { email, password, options } = req.body;
  const name = options?.data?.name || req.body.name || "";
  const user_type = options?.data?.user_type || req.body.user_type || "volunteer";

  if (!email || !password) {
    return res.json({ data: { user: null }, error: { message: "Email and password required" } });
  }

  try {
    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
    if (existing) {
      return res.json({ data: { user: null }, error: { message: "User already registered" } });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const result = db.prepare(
      "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)"
    ).run(name, email, password_hash, user_type);

    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(result.lastInsertRowid);
    console.log(`User registered: ${email} (${user_type})`);
    return res.json({ data: { user: makeUserObject(user) }, error: null });
  } catch (err) {
    console.error("Signup error:", err);
    return res.json({ data: { user: null }, error: { message: err.message } });
  }
});

// POST /api/auth/login
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.json({ data: { user: null, session: null }, error: { message: "Email and password required" } });
  }

  try {
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    if (!user) {
      return res.json({ data: { user: null, session: null }, error: { message: "Invalid login credentials" } });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.json({ data: { user: null, session: null }, error: { message: "Invalid login credentials" } });
    }

    const userObj = makeUserObject(user);
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    console.log(`Login: ${email} (${user.role})`);
    return res.json({
      data: {
        user: userObj,
        session: { access_token: token, user: userObj },
      },
      error: null,
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.json({ data: { user: null, session: null }, error: { message: err.message } });
  }
});

// POST /api/auth/logout
app.post("/api/auth/logout", (req, res) => {
  res.json({ error: null });
});

// GET /api/auth/session
app.get("/api/auth/session", (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.json({ data: { session: null }, error: null });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(decoded.id);
    if (!user) return res.json({ data: { session: null }, error: null });

    const userObj = makeUserObject(user);
    return res.json({
      data: { session: { access_token: token, user: userObj } },
      error: null,
    });
  } catch {
    return res.json({ data: { session: null }, error: null });
  }
});

// GET /api/auth/user
app.get("/api/auth/user", (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.json({ data: { user: null }, error: { message: "Not authenticated" } });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(decoded.id);
    if (!user) return res.json({ data: { user: null }, error: { message: "User not found" } });
    return res.json({ data: { user: makeUserObject(user) }, error: null });
  } catch {
    return res.json({ data: { user: null }, error: { message: "Invalid token" } });
  }
});

// PUT /api/auth/user — update password and/or metadata
app.put("/api/auth/user", async (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.json({ data: { user: null }, error: { message: "Not authenticated" } });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(decoded.id);
    if (!user) return res.json({ data: { user: null }, error: { message: "User not found" } });

    const { password, data: metadata } = req.body;

    if (password) {
      const hash = await bcrypt.hash(password, 10);
      db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hash, user.id);
    }

    if (metadata) {
      if (metadata.name !== undefined) {
        db.prepare("UPDATE users SET name = ? WHERE id = ?").run(metadata.name, user.id);
      }
      if (metadata.preferences || metadata.contact_number !== undefined) {
        const existing = (() => {
          try { return JSON.parse(user.preferences || "{}"); } catch { return {}; }
        })();
        const merged = { ...existing };
        if (metadata.preferences) Object.assign(merged, metadata.preferences);
        if (metadata.contact_number !== undefined) merged.contact_number = metadata.contact_number;
        db.prepare("UPDATE users SET preferences = ? WHERE id = ?").run(JSON.stringify(merged), user.id);
      }
    }

    const updated = db.prepare("SELECT * FROM users WHERE id = ?").get(user.id);
    return res.json({ data: { user: makeUserObject(updated) }, error: null });
  } catch (err) {
    console.error("Update user error:", err);
    return res.json({ data: { user: null }, error: { message: err.message } });
  }
});

// POST /api/auth/reset-password
app.post("/api/auth/reset-password", (req, res) => {
  const { email } = req.body;
  if (!email) return res.json({ data: {}, error: { message: "Email required" } });

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user) return res.json({ data: {}, error: null }); // Don't reveal if user exists

  const resetToken = crypto.randomBytes(32).toString("hex");
  const expires = Date.now() + 3600000; // 1 hour
  db.prepare("UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?").run(resetToken, expires, user.id);

  const resetUrl = `http://localhost:3000/reset-password?token=${resetToken}&role=${user.role}`;
  console.log(`\n=== PASSWORD RESET ===`);
  console.log(`Email: ${email}`);
  console.log(`Reset URL: ${resetUrl}`);
  console.log(`======================\n`);

  return res.json({ data: {}, error: null });
});

// POST /api/auth/reset-password/confirm
app.post("/api/auth/reset-password/confirm", async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.json({ data: {}, error: { message: "Token and password required" } });

  try {
    const user = db.prepare(
      "SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > ?"
    ).get(token, Date.now());

    if (!user) return res.json({ data: {}, error: { message: "Invalid or expired reset token" } });

    const hash = await bcrypt.hash(password, 10);
    db.prepare(
      "UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?"
    ).run(hash, user.id);

    return res.json({ data: {}, error: null });
  } catch (err) {
    console.error("Confirm reset error:", err);
    return res.json({ data: {}, error: { message: err.message } });
  }
});

// ---------- STUDENT FORM ENDPOINTS ----------

// GET /api/student-forms
app.get("/api/student-forms", (req, res) => {
  try {
    const { volunteer_email, id, single, select: selectFields, eq_field, eq_value, order_field, order_ascending } = req.query;

    if (id && single === "true") {
      const row = db.prepare("SELECT * FROM student_form_submissions WHERE id = ?").get(id);
      return res.json({ data: transformStudentRow(row), error: null });
    }

    let sql = "SELECT";
    sql += (selectFields && selectFields !== "*") ? ` ${selectFields}` : " *";
    sql += " FROM student_form_submissions";

    const conditions = [];
    const params = [];

    if (volunteer_email) { conditions.push("volunteer_email = ?"); params.push(volunteer_email); }
    if (eq_field && eq_value !== undefined) { conditions.push(`${eq_field} = ?`); params.push(eq_value); }
    if (conditions.length > 0) sql += " WHERE " + conditions.join(" AND ");

    const orderCol = order_field || "created_at";
    const orderDir = order_ascending === "true" ? "ASC" : "DESC";
    sql += ` ORDER BY ${orderCol} ${orderDir}`;

    const rows = db.prepare(sql).all(...params);
    return res.json({ data: rows.map(transformStudentRow), error: null });
  } catch (err) {
    console.error("GET student-forms error:", err);
    return res.json({ data: null, error: { message: err.message } });
  }
});

// POST /api/student-forms
app.post("/api/student-forms", (req, res) => {
  try {
    const payloadArray = Array.isArray(req.body) ? req.body : [req.body];
    const results = [];

    for (const rawPayload of payloadArray) {
      const payload = prepareStudentPayload(rawPayload);
      const columns = Object.keys(payload);
      const placeholders = columns.map(() => "?").join(", ");
      const values = columns.map((c) => payload[c] ?? null);

      const result = db.prepare(
        `INSERT INTO student_form_submissions (${columns.join(", ")}) VALUES (${placeholders})`
      ).run(...values);

      const inserted = db.prepare("SELECT * FROM student_form_submissions WHERE id = ?").get(result.lastInsertRowid);
      results.push(transformStudentRow(inserted));
    }

    console.log(`Student form(s) inserted: ${results.map(r => r.id).join(", ")}`);
    return res.json({ data: results, error: null });
  } catch (err) {
    console.error("POST student-forms error:", err);
    return res.json({ data: null, error: { message: err.message } });
  }
});

// PUT /api/student-forms/:id
app.put("/api/student-forms/:id", (req, res) => {
  try {
    const { id } = req.params;
    const payload = prepareStudentPayload(req.body);
    const columns = Object.keys(payload);
    if (columns.length === 0) return res.json({ data: null, error: { message: "No fields to update" } });

    const setClause = columns.map((c) => `${c} = ?`).join(", ");
    const values = columns.map((c) => payload[c] ?? null);

    db.prepare(`UPDATE student_form_submissions SET ${setClause} WHERE id = ?`).run(...values, id);
    const updated = db.prepare("SELECT * FROM student_form_submissions WHERE id = ?").get(id);
    console.log(`Student form updated: ${id}`);
    return res.json({ data: transformStudentRow(updated), error: null });
  } catch (err) {
    console.error("PUT student-forms error:", err);
    return res.json({ data: null, error: { message: err.message } });
  }
});

// DELETE /api/student-forms/:id
app.delete("/api/student-forms/:id", (req, res) => {
  try {
    const { id } = req.params;
    db.prepare("DELETE FROM student_form_submissions WHERE id = ?").run(id);
    console.log(`Student form deleted: ${id}`);
    return res.json({ data: null, error: null });
  } catch (err) {
    console.error("DELETE student-forms error:", err);
    return res.json({ data: null, error: { message: err.message } });
  }
});

// ---------- ADMIN ENDPOINTS ----------

app.get("/api/admin/students", (req, res) => {
  try {
    const { select: selectFields, order_field, order_ascending } = req.query;
    let sql = "SELECT";
    sql += (selectFields && selectFields !== "*") ? ` ${selectFields}` : " *";
    sql += " FROM student_form_submissions";

    const orderCol = order_field || "created_at";
    const orderDir = order_ascending === "true" ? "ASC" : "DESC";
    sql += ` ORDER BY ${orderCol} ${orderDir}`;

    const rows = db.prepare(sql).all();
    return res.json({ data: rows.map(transformStudentRow), error: null });
  } catch (err) {
    console.error("GET admin/students error:", err);
    return res.json({ data: null, error: { message: err.message } });
  }
});

app.put("/api/admin/students/:id", (req, res) => {
  try {
    const { id } = req.params;
    const payload = prepareStudentPayload(req.body);
    const columns = Object.keys(payload);
    if (columns.length === 0) return res.json({ data: null, error: { message: "No fields to update" } });

    const setClause = columns.map((c) => `${c} = ?`).join(", ");
    const values = columns.map((c) => payload[c] ?? null);

    db.prepare(`UPDATE student_form_submissions SET ${setClause} WHERE id = ?`).run(...values, id);
    const updated = db.prepare("SELECT * FROM student_form_submissions WHERE id = ?").get(id);
    return res.json({ data: transformStudentRow(updated), error: null });
  } catch (err) {
    console.error("PUT admin/students error:", err);
    return res.json({ data: null, error: { message: err.message } });
  }
});

app.get("/api/admin/eligible", (req, res) => {
  try {
    const { count_only, order_field, order_ascending } = req.query;

    if (count_only === "true") {
      const row = db.prepare("SELECT COUNT(*) as count FROM student_form_submissions WHERE status = 'eligible'").get();
      return res.json({ count: row.count, data: null, error: null });
    }

    let sql = "SELECT * FROM student_form_submissions WHERE status = 'eligible'";
    const orderCol = order_field || "created_at";
    const orderDir = order_ascending === "true" ? "ASC" : "DESC";
    sql += ` ORDER BY ${orderCol} ${orderDir}`;

    const rows = db.prepare(sql).all();
    return res.json({ data: rows.map(transformStudentRow), error: null, count: rows.length });
  } catch (err) {
    console.error("GET admin/eligible error:", err);
    return res.json({ data: null, error: { message: err.message } });
  }
});

app.get("/api/admin/non-eligible", (req, res) => {
  try {
    const { count_only, order_field, order_ascending } = req.query;

    if (count_only === "true") {
      const row = db.prepare("SELECT COUNT(*) as count FROM student_form_submissions WHERE status = 'non_eligible'").get();
      return res.json({ count: row.count, data: null, error: null });
    }

    let sql = "SELECT * FROM student_form_submissions WHERE status = 'non_eligible'";
    const orderCol = order_field || "created_at";
    const orderDir = order_ascending === "true" ? "ASC" : "DESC";
    sql += ` ORDER BY ${orderCol} ${orderDir}`;

    const rows = db.prepare(sql).all();
    return res.json({ data: rows.map(transformStudentRow), error: null, count: rows.length });
  } catch (err) {
    console.error("GET admin/non-eligible error:", err);
    return res.json({ data: null, error: { message: err.message } });
  }
});

// ---------- FILE UPLOAD ----------

app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const folder = req.body.folder || "general";
  const publicUrl = `http://localhost:${PORT}/uploads/${folder}/${req.file.filename}`;
  return res.json({ publicUrl });
});

// ---------- LEGACY ENDPOINT (backward compat with register.js) ----------

app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.json({ success: false, message: "All fields required" });

  try {
    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
    if (existing) return res.json({ success: false, message: "Email already exists" });

    const password_hash = await bcrypt.hash(password, 10);
    const result = db.prepare(
      "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)"
    ).run(name, email, password_hash, "volunteer");
    console.log(`Volunteer registered (legacy): ${email}`);
    return res.json({ success: true, message: "Registered", volunteer_id: result.lastInsertRowid });
  } catch (e) {
    console.error("Registration error:", e);
    return res.json({ success: false, message: "Server error" });
  }
});

// ---------- START SERVER ----------

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
