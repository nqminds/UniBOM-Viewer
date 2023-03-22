module.exports = {
  env: {
    es2021: true,
  },
  // todo, is it worth the effort to use the nqm eslint config?
  extends: ["plugin:@next/next/recommended"],
  overrides: [],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  rules: {},
};
