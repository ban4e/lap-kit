import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import eslintPluginImportX from 'eslint-plugin-import-x';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import storybook from 'eslint-plugin-storybook';
import globals from 'globals';
import tseslint, { configs as tsConfigs, parser as tsParser } from 'typescript-eslint';

/** @type {import('eslint').Linter.Config} */
export default tseslint.config(
    { ignores: ['dist', '!.storybook'] },
    {
        files: ['**/*.stories.@(ts|tsx|js|jsx|mjs|cjs)'],
        extends: [storybook.configs['flat/recommended']]
    },
    {
        ignores: [
            'src/**/*.stories.{js,jsx,mjs,cjs,ts,tsx}',
            'src/**/*.test.{js,jsx,mjs,cjs,ts,tsx}',
            'src/__mocks__/**/*.{js,jsx,mjs,cjs,ts,tsx}'
        ],
        files: ['src/**/*.{js,jsx,mjs,cjs,ts,tsx}'],
        rules: {
            'import-x/no-default-export': 2
        }
    },
    {
        files: ['**/*.{js,jsx,mjs,cjs}'],
        rules: {
            'no-undef': 2 // This rule is enabled for JavaScript files to catch references to undefined variables.
        }
    },
    {
        files: ['**/*.{js,jsx,mjs,cjs,ts,tsx}'],
        extends: [
            eslint.configs.recommended,
            ...tsConfigs.recommended,
            reactPlugin.configs.flat.recommended,
            reactPlugin.configs.flat['jsx-runtime'],
            reactRefresh.configs.vite,
            jsxA11y.flatConfigs.recommended,
            eslintPluginImportX.flatConfigs.recommended,
            eslintPluginImportX.flatConfigs.typescript,
            eslintPluginPrettierRecommended,
            eslintConfigPrettier
        ],
        settings: {
            react: {
                version: 'detect',
                jsxRuntime: 'automatic' // Use "automatic" for the new JSX transform
            },
            'import/resolver-next': [
                createTypeScriptImportResolver({
                    alwaysTryTypes: true,
                    project: './tsconfig.json'
                })
            ]
        },
        plugins: {
            react: reactPlugin,
            'react-hooks': reactHooks
        },
        languageOptions: {
            // ...reactPlugin.configs.flat.recommended.languageOptions,
            // ...jsxA11y.flatConfigs.recommended.languageOptions,
            parserOptions: {
                parser: tsParser,
                ecmaVersion: 'latest',
                sourceType: 'module',
                // projectService: true,
                // tsconfigRootDir: import.meta.dirname,
                ecmaFeatures: {
                    jsx: true
                }
            },
            globals: {
                ...globals.browser,
                ...globals.node,
                ...globals.builtin,
                React: 'writable'
            }
        },
        rules: {
            // Code style
            indent: [2, 4, { SwitchCase: 1, offsetTernaryExpressions: 1 }],
            'comma-dangle': [2, 'never'],
            'padding-line-between-statements': [2, { blankLine: 'always', prev: '*', next: 'return' }],
            'consistent-return': 0,
            'no-undef': 0, // This rule is disabled for TypeScript files because TS type checker already ensures that variables are declared and defined.
            'no-unused-expressions': [
                2,
                {
                    allowTernary: true,
                    allowShortCircuit: true
                }
            ],
            'no-console': [2, { allow: ['warn', 'error'] }],
            'no-plusplus': 0,
            'no-param-reassign': [2, { props: false }],
            'no-restricted-syntax': 0,
            'no-nested-ternary': 0,
            'max-classes-per-file': 0,
            eqeqeq: 2,
            'prefer-arrow-callback': [2, { allowNamedFunctions: true }],
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
            'import-x/no-cycle': 2,
            'import-x/no-unresolved': 2,
            'import-x/extensions': [
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
            'import-x/no-extraneous-dependencies': [2, { devDependencies: true }],
            'import-x/order': [
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
            'import-x/prefer-default-export': 0,

            // React
            ...reactHooks.configs.recommended.rules,
            'react/jsx-uses-react': 0,
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
            'react/jsx-filename-extension': [1, { extensions: ['.js', '.jsx', '.ts', '.tsx'] }],
            'react-refresh/only-export-components': [1, { allowConstantExport: true }], // Vite supports it. See details https://github.com/ArnaudBarre/eslint-plugin-react-refresh/releases/tag/v0.4.0
            'react/jsx-no-useless-fragment': [2, { allowExpressions: true }]
        }
    }
);
