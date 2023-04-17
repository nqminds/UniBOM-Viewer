/**
 * @type {import("eslint").Linter.Config}
 */
module.exports = {
  parser: "@typescript-eslint/parser",
  env: {
    es2021: true,
    node: true,
  },
  extends: [
    "plugin:@next/next/recommended",
    "plugin:@typescript-eslint/recommended",
  ],
  plugins: ["@typescript-eslint", "react"],
  overrides: [],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  rules: {
    "jsdoc/require-jsdoc": 0,
    "operator-linebreak": 0,
    "space-before-function-paren": 0,
  },
};
