import love from 'eslint-config-love'
import stylistic from '@stylistic/eslint-plugin'

export default [
  {
    ...love,
    files: ['**/*.ts'],
    languageOptions: {
      ...love.languageOptions,
      parserOptions: {
        ...love.languageOptions.parserOptions,
        projectService: true
      }
    },
    plugins: {
      ...love.plugins,
      '@stylistic': stylistic
    },
    rules: {
      ...stylistic.configs.recommended.rules,
      ...love.rules,
      // STRUCTURAL RULES
      'complexity': 'off', // overkill
      'eqeqeq': ['error', 'smart'],
      'max-depth': 'off', // overkill
      'max-lines': 'off', // overkill, long test files are normal
      'max-nested-callbacks': 'off', // overkill, playwright tests nest callbacks constantly
      'no-await-in-loop': 'off', // playwright tests legitimately await page actions in sequence inside loops
      'no-console': 'off',
      'no-negated-condition': 'off', // overkill
      'no-plusplus': ['error', { allowForLoopAfterthoughts: true }], // allow normal for loops
      'prefer-named-capture-group': 'off', // do not prefer
      'prefer-template': 'off', // unnecessary
      'promise/avoid-new': 'off',
      'require-unicode-regexp': 'off', // overkill
      '@typescript-eslint/array-type': ['error', { default: 'array' }],
      '@typescript-eslint/consistent-type-assertions': 'off', // we use `{ ... } as T` a lot and love's default forbids it
      '@typescript-eslint/explicit-function-return-type': 'off', // useless boilerplate
      '@typescript-eslint/init-declarations': 'off',
      '@typescript-eslint/max-params': 'off', // overkill
      '@typescript-eslint/no-confusing-void-expression': ['error', { ignoreArrowShorthand: true }],
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-loop-func': 'off',
      '@typescript-eslint/no-magic-numbers': 'off',
      '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: false }], // passing an async function where void is expected is fine; keep the check that catches promises used as booleans
      '@typescript-eslint/no-non-null-assertion': 'off', // would have disabled using ! to mark something as non-null,
                                                         // generally not avoidable without wasting cpu cycles on a check
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/no-unsafe-type-assertion': 'off', // we assert types from API responses a lot
      '@typescript-eslint/no-unused-vars': 'off', // typescript already reports this and VSCode darkens the variable
      '@typescript-eslint/prefer-destructuring': 'off', // no reason to force destructuring
      '@typescript-eslint/prefer-for-of': 'off', // overkill
      '@typescript-eslint/prefer-nullish-coalescing': ['error', { ignoreConditionalTests: true, ignorePrimitives: true }], // this is supposed to be the default but apparently eslint-config-love overrode it to something stupid
      '@typescript-eslint/prefer-readonly': 'off', // readonly adds a lot of complication and often infects other code with its complexity
      '@typescript-eslint/prefer-regexp-exec': 'off', // unhelpful
      '@typescript-eslint/require-await': 'off', // sometimes we make async functions because upstream code expects a promise, even if we don't have any awaits inside
      '@typescript-eslint/restrict-template-expressions': ['error', { allowAny: true }], // `${myVar}` is fine if myVar is `any`
      '@typescript-eslint/strict-boolean-expressions': 'off', // we know how truthiness works, annoying to have to avoid
      '@typescript-eslint/strict-void-return': 'off', // passing an async function where void is expected is fine
      // FORMATTING RULES
      '@stylistic/arrow-parens': ['error', 'as-needed'],
      '@stylistic/brace-style': ['error', '1tbs', { allowSingleLine: true }],
      '@stylistic/comma-dangle': ['error', 'never'],
      '@stylistic/indent': ['error', 2, { ignoreComments: true }],
      '@stylistic/max-statements-per-line': ['error', { max: 2 }],
      '@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
      '@stylistic/quote-props': ['error', 'as-needed'],
      '@stylistic/space-before-function-paren': ['error', 'always'],
      '@stylistic/type-annotation-spacing': 'error',
      '@stylistic/type-generic-spacing': 'error'
    }
  }
]
