module.exports = {
  env: {
    es2021: true,
    node: true,
  },
  extends: ["plugin:@next/next/recommended", "@nqminds/eslint-config"],
  overrides: [],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  rules: {},
};
