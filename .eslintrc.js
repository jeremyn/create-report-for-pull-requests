module.exports = {
  extends: 'airbnb-base',
  env: {
    mocha: true,
  },
  rules: {
    'no-console': 'off',
    'no-param-reassign': ['error', { props: false }],
  },
};
