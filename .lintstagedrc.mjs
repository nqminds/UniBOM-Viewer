export default {
  "*.{m,c}?jsx?": [
    "eslint --cache --cache-strategy content",
    "prettier --write",
  ],
  "*.{md,html,css,json,yaml}": ["prettier --write"],
};
