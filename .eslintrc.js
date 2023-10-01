module.exports = {
  parser: '@typescript-eslint/parser',
  env: {
    node: true,
    jest: true,
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  root: true,
  overrides: [
    {
      env: {
        node: true,
      },
      files: ['.eslintrc.{js,cjs,ts}'],
      parserOptions: {
        sourceType: 'script',
      },
    },
  ],
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    '@typescript-eslint/interface-name-prefix': 0,
    '@typescript-eslint/prefer-nullish-coalescing': 0,
    '@typescript-eslint/strict-boolean-expressions': 0,
  },
};
