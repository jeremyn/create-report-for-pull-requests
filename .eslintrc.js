module.exports = {
  extends: 'airbnb-base',
  env: {
    mocha: true,
  },
  rules: {
    'function-paren-newline': ['error', 'consistent'],
    'no-console': 'off',
    'no-param-reassign': ['error', { props: false }],
  },
};
