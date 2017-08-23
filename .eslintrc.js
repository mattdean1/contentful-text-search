module.exports = {
  extends: "eslint:recommended",
  rules: {
    "no-console": 0,
    quotes: ["error", "backtick"],
    semi: ["error", "never"]
  },
  env: {
    node: true,
    es6: true
  },
  parserOptions: {
    ecmaFeatures: {
      modules: "true"
    },
    sourceType: "module"
  }
}
