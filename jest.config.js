export default {
  testEnvironment: "node",
  transform: {},
  globals: {
    "ts-jest": {
      useESM: true,
    },
  },
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  testMatch: ["**/test-*.js"],
  setupFilesAfterEnv: ["<rootDir>/test-setup.js"],
  extensionsToTreatAsEsm: [".js"],
  preset: undefined,
  transformIgnorePatterns: ["node_modules/(?!(dotenv)/)"],
};
