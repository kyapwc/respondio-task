const js = require('@eslint/js')

module.exports = [
  js.configs.recommended,
  {
    rules: {
      "no-unused-vars": "warn",
      "no-undef": "warn",
    },
    parserOptions: {
      ecmaVersion: 9,
    },
    env: {
      "es6": true,
      "node": true,
      "browser": true,
      "amd": true,
    },
  },
]
