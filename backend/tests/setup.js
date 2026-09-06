// Runs once before all test files. Forces the app into in-memory data mode
// so tests never need a real MongoDB connection.
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret";

const initInMemory = require("../inMemoryData");

// Re-seed fresh in-memory data before EVERY test file so tests don't leak
// state into each other (each test file gets john/jane + the sample listings).
beforeEach(() => {
  initInMemory();
});
