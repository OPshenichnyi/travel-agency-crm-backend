export default {
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.js", "**/tests/**/*.spec.js"],
  transformIgnorePatterns: ["node_modules/(?!(dotenv)/)"],
};
