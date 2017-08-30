module.exports = {
  extends: `eslint:recommended`,
  rules: {
    "no-console": 0,
    "object-curly-spacing": [`error`, `always`],
    "comma-dangle": [`error`, `always-multiline`],
    quotes: [`error`, `backtick`],
    semi: [`error`, `never`],
    "arrow-body-style": [
      `error`,
      `as-needed`,
      { requireReturnForObjectLiteral: true },
    ],
  },
  env: {
    node: true,
    es6: true,
    mocha: true,
  },
  parserOptions: {
    ecmaVersion: 2017,
  },
}
