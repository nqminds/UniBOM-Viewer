/**
 * @type {import("eslint").Linter.Config}
 */
module.exports = {
  parser: "@babel/eslint-parser",
  parserOptions: {
    requireConfigFile: false,
    babelOptions: {
      plugins: ["@babel/plugin-syntax-import-assertions"],
    },
  },
  rules: {
    "space-before-function-paren": 0,
    "object-curly-spacing": 0,
    "comma-dangle": 0,
  },
};
