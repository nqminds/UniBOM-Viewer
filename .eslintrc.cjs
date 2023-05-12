/**
 * @type {import("eslint").Linter.Config}
 */
module.exports = {
  env: {
    es2021: true,
    node: true,
  },
  extends: ["@nqminds/eslint-config", "prettier"],
  overrides: [
    {
      // TypeScript files shouldn't have JSDoc types
      files: ["*.ts", "*.tsx"],
      rules: {
        "jsdoc/no-types": 1,
        "jsdoc/require-param-type": 0,
        "jsdoc/require-property-type": 0,
        "jsdoc/require-returns-type": 0,
      },
    },
  ],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  rules: {},
};
