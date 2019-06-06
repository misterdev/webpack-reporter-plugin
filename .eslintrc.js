module.exports = {
  root: true,
  extends: ['@webpack-contrib/eslint-config-webpack', 'prettier'],
  rules: {
    'guard-for-in': 'warn',
    'no-unused-vars': 'warn',
  },
};
