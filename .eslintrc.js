module.exports = {
  extends: "eslint:recommended",
  rules: {
    "no-console": 0,
    "object-curly-spacing": ["error", "always"],
    "comma-dangle": [
      "error",
      {
        arrays: "always-multiline",
        objects: "always-multiline",
        imports: "always-multiline",
        exports: "always-multiline",
        functions: "ignore",
      },
    ],
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
