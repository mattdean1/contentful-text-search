module.exports = {
  extends: "eslint:recommended",
  rules: {
    "no-console": 0,
    "object-curly-spacing": ["error", "always"],
    "comma-dangle": ["error", "always-multiline"],
    quotes: ["error", "backtick"],
    semi: ["error", "never"],
  },
  env: {
    node: true,
  },
  parserOptions: {
    ecmaVersion: 2017,
    sourceType: "module",
  },
}
