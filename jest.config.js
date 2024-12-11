module.exports = {
  preset: "ts-jest", // Use ts-jest for TypeScript
  testEnvironment: "node", // Run tests in the Node.js environment
  moduleFileExtensions: ["js", "ts", "json"], // Supported file extensions for imports
  roots: ["<rootDir>/src"], // Where to look for the test files
  testMatch: [
    "**/src/__tests__/**/*.test.ts",
    "**/src/__tests__/**/*.test.tsx",
  ], // Match files ending in .test.ts or .spec.ts
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest", // Use ts-jest for transforming TypeScript files
  },
  collectCoverage: true, // Collect coverage reports
  coverageDirectory: "coverage", // Output coverage reports in the "coverage" folder
  coverageProvider: "v8", // Use V8 engine to collect coverage
  verbose: true, // Print individual test results
  // REMOVE the setupFilesAfterEnv option if not required
};
