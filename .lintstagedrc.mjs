export default {
  "*.{mjs,cjs,js,jsx}": [
    "eslint --cache --cache-strategy content",
    "prettier --write",
  ],
  "*.{md,html,css,json,yaml}": ["prettier --write"],
};
