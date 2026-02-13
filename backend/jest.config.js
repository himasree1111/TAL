module.exports = {
  testEnvironment: "node",
  testMatch: ["**/test/**/*.test.js"],
  maxWorkers: 1,
  verbose: true,
  // @libsql/client uses package.json "exports" which Jest's resolver doesn't
  // support by default. Map sub-path imports to their CJS entry points.
  moduleNameMapper: {
    "^@libsql/core/(.*)$": "<rootDir>/node_modules/@libsql/core/lib-cjs/$1.js",
  },
};
