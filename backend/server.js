// server.js
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcryptjs");
const cors = require("cors");

const app = express();
const PORT = 4000;
const DB_FILE = "./volunteer.db"; // <- change to "./volunteer.ds" if your DB file is named that

app.use(cors());
app.use(express.json());

// Open DB
const db = new sqlite3.Database(DB_FILE, (err) => {
  if (err) {
    console.error("❌ Failed to open DB:", err.message);
    process.exit(1);
  }
  console.log("✅ Connected to SQLite database!");
});

// reduce locking problems
db.configure && db.configure("busyTimeout", 5000);
db.serialize(() => {
  db.run("PRAGMA foreign_keys = ON;");
  db.run("PRAGMA journal_mode = WAL;");
});

// Create tables (if not exists)
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS volunteer (
      volunteer_id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT UNIQUE,
      password_hash TEXT
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS donor (
      donor_id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT UNIQUE,
      password_hash TEXT
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS student_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      volunteer_id INTEGER,
      full_name TEXT,
      age INTEGER,
      email TEXT UNIQUE,
      contact_no TEXT,
      whatsapp_no TEXT,
      parent_no TEXT,
      family_members TEXT,
      parents_names TEXT,
      earning_members TEXT,
      school_college TEXT,
      branch TEXT,
      previous_percentage REAL,
      present_percentage REAL,
      course_class_fee TEXT,
      job_details TEXT,
      aspiration TEXT,
      scholarship_details TEXT,
      FOREIGN KEY (volunteer_id) REFERENCES volunteer(volunteer_id)
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS student_document (
      doc_id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      school_id_collected TEXT DEFAULT 'N',
      fees_receipt_collected TEXT DEFAULT 'N',
      aadhaar_collected TEXT DEFAULT 'N',
      income_proof_collected TEXT DEFAULT 'N',
      marksheets_collected TEXT DEFAULT 'N',
      fees_transfer_details TEXT,
      bank_account_details TEXT,
      passport_photo_collected TEXT DEFAULT 'N',
      volunteer_verification TEXT,
      volunteer_signature TEXT,
      girl_verification TEXT,
      girl_signature TEXT,
      parent_signature TEXT,
      FOREIGN KEY (student_id) REFERENCES student_records(id)
    );
  `);
});

// ---------- REGISTER VOLUNTEER ----------
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.json({ success: false, message: "All fields required" });

  try {
    const password_hash = await bcrypt.hash(password, 10);
    const sql = `INSERT INTO volunteer (name, email, password_hash) VALUES (?, ?, ?)`;
    db.run(sql, [name, email, password_hash], function (err) {
      if (err) {
        console.error("Registration error:", err);
        if (err.code === "SQLITE_CONSTRAINT") return res.json({ success: false, message: "Email already exists" });
        return res.json({ success: false, message: "Registration failed" });
      }
      console.log(`✅ Volunteer registered with ID: ${this.lastID}`);
      return res.json({ success: true, message: "Registered", volunteer_id: this.lastID });
    });
  } catch (e) {
    console.error("Hashing error:", e);
    return res.json({ success: false, message: "Server error" });
  }
});

// ---------- REGISTER DONOR ----------
app.post("/register-donor", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.json({ success: false, message: "All fields required" });

  try {
    const password_hash = await bcrypt.hash(password, 10);
    const sql = `INSERT INTO donor (name, email, password_hash) VALUES (?, ?, ?)`;
    db.run(sql, [name, email, password_hash], function (err) {
      if (err) {
        console.error("Donor registration error:", err);
        if (err.code === "SQLITE_CONSTRAINT") return res.json({ success: false, message: "Email already exists" });
        return res.json({ success: false, message: "Registration failed" });
      }
      console.log(`✅ Donor registered with ID: ${this.lastID}`);
      return res.json({ success: true, message: "Registered", donor_id: this.lastID });
    });
  } catch (e) {
    console.error("Hashing error:", e);
    return res.json({ success: false, message: "Server error" });
  }
});

// ---------- LOGIN VOLUNTEER ----------
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ success: false, message: "Email and password required" });

  const sql = `SELECT * FROM volunteer WHERE email = ?`;
  db.get(sql, [email], async (err, row) => {
    if (err) {
      console.error("Login DB error:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    if (!row) return res.status(401).json({ success: false, message: "Invalid email or password" });

    try {
      const valid = await bcrypt.compare(password, row.password_hash);
      if (!valid) return res.status(401).json({ success: false, message: "Invalid email or password" });

      // success
      console.log(`✅ Login successful for volunteer_id=${row.volunteer_id}`);
      return res.json({ success: true, message: "Login successful", volunteer_id: row.volunteer_id, name: row.name });
    } catch (e) {
      console.error("Login compare error:", e);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  });
});

// ---------- LOGIN DONOR ----------
app.post("/login-donor", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ success: false, message: "Email and password required" });

  const sql = `SELECT * FROM donor WHERE email = ?`;
  db.get(sql, [email], async (err, row) => {
    if (err) {
      console.error("Donor login DB error:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    if (!row) return res.status(401).json({ success: false, message: "Invalid email or password" });

    try {
      const valid = await bcrypt.compare(password, row.password_hash);
      if (!valid) return res.status(401).json({ success: false, message: "Invalid email or password" });

      // success
      console.log(`✅ Donor login successful for donor_id=${row.donor_id}`);
      return res.json({ success: true, message: "Login successful", donor_id: row.donor_id, name: row.name });
    } catch (e) {
      console.error("Donor login compare error:", e);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  });
});

// ---------- STUDENT (PAGE 1) ----------
app.post("/student", (req, res) => {
  const s = req.body;
  if (!s.volunteer_id || !s.full_name) return res.json({ success: false, message: "Missing required fields" });

  const query = `
    INSERT INTO student_records
      (volunteer_id, full_name, age, email, contact_no, whatsapp_no, parent_no, family_members, parents_names, earning_members, school_college, branch, previous_percentage, present_percentage, course_class_fee, job_details, aspiration, scholarship_details, achievement_certificates, present_scholarship_details, years_in_area, scholarship_reason)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    s.volunteer_id,
    s.full_name || null,
    s.age || null,
    s.email || null,
    s.contact_no || null,
    s.whatsapp_no || null,
    s.parent_no || null,
    s.family_members || null,
    s.parents_names || null,
    s.earning_members || null,
    s.school_college || null,
    s.branch || null,
    s.previous_percentage || null,
    s.present_percentage || null,
    s.course_class_fee || null,
    s.job_details || null,
    s.aspiration || null,
    s.scholarship_details || null,
    s.achievement_certificates || null,
    s.present_scholarship_details || null,
    s.years_in_area || null,
    s.scholarship_reason || null
  ];

  db.run(query, values, function (err) {
    if (err) {
      console.error("Student insert error:", err);
      return res.json({ success: false, message: "Failed to insert student" });
    }
    console.log(`✅ Student saved id=${this.lastID}`);
    return res.json({ success: true, message: "Student saved", student_id: this.lastID });
  });
});

// ---------- STUDENT DOCS (PAGE 2) ----------
app.post("/studentdocs", (req, res) => {
  const d = req.body;
  if (!d.student_id) return res.json({ success: false, message: "student_id required" });

  const query = `
    INSERT INTO student_document
      (student_id, school_id_collected, fees_receipt_collected, aadhaar_collected, income_proof_collected, marksheets_collected, fees_transfer_details, bank_account_details, passport_photo_collected, volunteer_verification, volunteer_signature, girl_verification, girl_signature, parent_signature)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    d.student_id,
    d.school_id_collected || "N",
    d.fees_receipt_collected || "N",
    d.aadhaar_collected || "N",
    d.income_proof_collected || "N",
    d.marksheets_collected || "N",
    d.fees_transfer_details || null,
    d.bank_account_details || null,
    d.passport_photo_collected || "N",
    d.volunteer_verification || null,
    d.volunteer_signature || null,
    d.girl_verification || null,
    d.girl_signature || null,
    d.parent_signature || null
  ];

  db.run(query, values, function (err) {
    if (err) {
      console.error("Student docs insert error:", err);
      return res.json({ success: false, message: "Failed to insert document info" });
    }
    console.log(`✅ Student docs saved doc_id=${this.lastID} for student_id=${d.student_id}`);
    return res.json({ success: true, message: "Documents saved", doc_id: this.lastID });
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
