module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleFileExtensions: ["js", "ts", "json"],
  roots: ["<rootDir>/src", "<rootDir>"],
  testMatch: ["**/**/*.test.ts", "**/**/*.integration.test.ts"],

  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
  },
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageProvider: "v8",
  verbose: true,
};
