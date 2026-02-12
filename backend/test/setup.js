// Test setup: use in-memory libSQL database
process.env.TEST_DB = ":memory:";
process.env.JWT_SECRET = "test-secret-key";

const { app, db, initDb } = require("../server");

// Initialize tables before tests run
let initialized = false;
async function ensureInit() {
  if (!initialized) {
    await initDb();
    initialized = true;
  }
}

module.exports = { app, db, initDb, ensureInit };
