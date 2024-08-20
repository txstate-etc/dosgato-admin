module.exports = {
	root: true,
	parser: '@typescript-eslint/parser',
	extends: ['plugin:svelte/base', 'standard-with-typescript'],
	plugins: ['@typescript-eslint'],
	ignorePatterns: ['*.cjs', 'package/**/*', '*.config.js'],
	overrides: [{ files: ['*.svelte'], parser: 'svelte-eslint-parser', parserOptions: { parser: '@typescript-eslint/parser' } }],
  rules: {
    'import/first': 'off',
		'no-multiple-empty-lines': 'off',
		'no-self-assign': 'off', // self assign in svelte is to trigger reactivity
		'no-undef': 'off', // redundant with typescript
    'no-undef-init': 'off',
		'no-unused-vars': 'off',
		'no-use-before-define': 'off',
    '@typescript-eslint/array-type': 'off',
		'@typescript-eslint/consistent-type-assertions': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
		'@typescript-eslint/no-confusing-void-expression': ['error', { ignoreArrowShorthand: true }],
    '@typescript-eslint/no-non-null-assertion': 'off',
		'@typescript-eslint/no-this-alias': 'off',
		'@typescript-eslint/no-throw-literal': 'off', // sveltekit error() function does not return an Error :/
		'@typescript-eslint/no-unsafe-argument': 'off',
    '@typescript-eslint/no-unused-vars': 'off', // typescript does this better
		'@typescript-eslint/prefer-nullish-coalescing': 'off',
    '@typescript-eslint/prefer-readonly': 'off',
    '@typescript-eslint/require-await': 'off',
    '@typescript-eslint/return-await': ['error', 'always'],
    '@typescript-eslint/strict-boolean-expressions': 'off',
  },
	parserOptions: {
		project: './tsconfig.json',
		sourceType: 'module',
		extraFileExtensions: ['.svelte'],
		ecmaVersion: 2020
	},
	env: {
		browser: true,
		es2017: true,
		node: true
	}
};
