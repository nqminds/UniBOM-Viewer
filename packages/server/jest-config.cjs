/** @type {import('jest').Config} */
const config = {
  testEnvironment: "node",
  // ignore transformations
  transform: {
    "\\.[jt]sx?$": "babel-jest",
  },
};

module.exports = config;
