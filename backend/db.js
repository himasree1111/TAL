const path = require("path");

// Determine database URL:
// 1. TEST_DB=":memory:" → in-memory (tests)
// 2. TURSO_DATABASE_URL → remote Turso
// 3. fallback → local file
let url;
if (process.env.TEST_DB === ":memory:") {
  url = "file::memory:";
} else if (process.env.TURSO_DATABASE_URL) {
  url = process.env.TURSO_DATABASE_URL;
} else {
  url = `file:${path.join(__dirname, "app.db")}`;
}

const { createClient } = require("@libsql/client");

const client = createClient({
  url,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Async wrapper that mirrors the better-sqlite3 API shape:
//   db.prepare(sql).get(...args)  → Promise<row | undefined>
//   db.prepare(sql).all(...args)  → Promise<row[]>
//   db.prepare(sql).run(...args)  → Promise<{ lastInsertRowid, changes }>
//   db.exec(sql)                  → Promise<void>
//   db.pragma()                   → no-op
const db = {
  prepare(sql) {
    return {
      async get(...args) {
        const result = await client.execute({ sql, args });
        if (!result.rows.length) return undefined;
        return { ...result.rows[0] };
      },
      async all(...args) {
        const result = await client.execute({ sql, args });
        return result.rows.map((r) => ({ ...r }));
      },
      async run(...args) {
        const result = await client.execute({ sql, args });
        return {
          lastInsertRowid: Number(result.lastInsertRowid),
          changes: result.rowsAffected,
        };
      },
    };
  },

  async exec(sql) {
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    for (const stmt of statements) {
      await client.execute(stmt);
    }
  },

  pragma() {
    // No-op — Turso manages pragmas server-side
  },
};

module.exports = db;
