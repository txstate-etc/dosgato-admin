module.exports = {
  root: true,
  parser: 'babel-eslint', // This line is required to fix "unexpected token" errors
  extends: 'standard',
  plugins: [],
  ignorePatterns: [],
  overrides: [],
  settings: {},
  rules: {
  },
  parserOptions: {
    sourceType: 'module'
  },
  env: {
    browser: true,
    es2017: true,
    node: true
  }
}
