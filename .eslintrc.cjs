module.exports = {
    env: { browser: true, es2020: true },
    extends: [
        'airbnb',
        'airbnb-typescript',
        'plugin:@typescript-eslint/recommended',
        'plugin:react/recommended',
        'plugin:react-hooks/recommended',
        // This disables the formatting rules in ESLint that Prettier is going to be responsible for handling.
        // Make sure it's always the last config, so it gets the chance to override other configs.
        'plugin:prettier/recommended'
    ],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: {
            jsx: true
        },
        sourceType: 'module',
        project: './tsconfig.json'
    },
    plugins: ['import', 'react-refresh', 'prettier'],
    settings: {
        'import/extensions': ['.js', '.jsx', '.ts', '.tsx'],
        'import/parsers': {
            '@typescript-eslint/parser': ['.ts', '.tsx']
        },
        'import/resolver': {
            typescript: {
                alwaysTryTypes: true,
                project: './tsconfig.json'
            }
        }
    },
    rules: {
        // Code style
        'comma-dangle': [2, 'never'],
        'padding-line-between-statements': [2, { blankLine: 'always', prev: '*', next: 'return' }],
        'consistent-return': 0,
        'no-unused-expressions': 0,
        'no-console': [2, { allow: ['warn', 'error'] }],
        'no-plusplus': 0,
        'no-param-reassign': [2, { props: false }],
        'no-restricted-syntax': 0,
        'no-nested-ternary': 0,
        'max-classes-per-file': 0,
        'jsx-a11y/label-has-associated-control': [
            2,
            {
                assert: 'either',
                depth: 3
            }
        ],
        '@typescript-eslint/no-unused-expressions': [
            2,
            {
                allowTernary: true,
                allowShortCircuit: true
            }
        ],
        '@typescript-eslint/no-unused-vars': 0, // duplicate 'no-unused-vars'
        '@typescript-eslint/no-use-before-define': [
            2,
            {
                functions: false
            }
        ],

        // Imports
        'import/no-cycle': 2,
        'import/no-unresolved': 2,
        'import/extensions': [
            2,
            'ignorePackages',
            {
                '': 'never', // this isn't the best solution, because it doesn't require extensions at all
                js: 'never',
                jsx: 'never',
                ts: 'never',
                tsx: 'never',
                'd.ts': 'always'
            }
        ],
        'import/no-extraneous-dependencies': [2, { devDependencies: true }],
        'import/order': [
            2,
            {
                groups: ['builtin', 'external', 'internal', ['sibling', 'parent'], 'object', 'type'],
                pathGroups: [
                    {
                        pattern: '@/**',
                        group: 'internal',
                        position: 'before'
                    },
                    {
                        pattern: '@components/**',
                        group: 'internal',
                        position: 'before'
                    }
                ],
                pathGroupsExcludedImportTypes: ['builtin', 'object'],
                'newlines-between': 'always',
                alphabetize: {
                    order: 'asc' /* sort in ascending order */,
                    caseInsensitive: false /* ignore case */
                }
            }
        ],

        // Prettier
        // 'prettier/prettier': [4, { trailingComma: 'none', printWidth: 120 }],

        // React
        'react/react-in-jsx-scope': 0,
        'react/jsx-props-no-spreading': 0,
        'react/button-has-type': 0, // off due to no dynamic content inside. For example, <button type={btnType}></button> will be wrong
        'react/require-default-props': 0,
        'react/destructuring-assignment': 0,
        'react/jsx-sort-props': [
            2,
            {
                callbacksLast: true,
                reservedFirst: true
            }
        ],
        'react/function-component-definition': [
            2,
            {
                namedComponents: 'arrow-function'
            }
        ],
        'react/jsx-uses-react': 0,
        'react/jsx-filename-extension': [1, { extensions: ['.js', '.jsx', '.ts', '.tsx'] }],
        'react-refresh/only-export-components': [1, { allowConstantExport: true }], // Vite supports it. See details https://github.com/ArnaudBarre/eslint-plugin-react-refresh/releases/tag/v0.4.0
        'react/jsx-no-useless-fragment': [2, { allowExpressions: true }]
    }
};
