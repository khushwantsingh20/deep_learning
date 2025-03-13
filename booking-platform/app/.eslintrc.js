const assert = require('assert');
const path = require('path');
const restrictedGlobals = require('confusing-browser-globals');

// In dev it's annoying to have these lint errors shown - it's really only in CI we care about
// it given the reformat commit hook should fix this anyway
const lintPrettier = process.env.LINT_PRETTIER;
const globals = {
    __DEBUG__: false,
    __DEBUG_NEW_WINDOW__: false,
};
const rules = {
    'no-restricted-globals': ['error'].concat(restrictedGlobals),
    'no-only-tests/no-only-tests': [
        'error',
        { block: ['test', 'it', 'assert', 'describe'], focus: ['only', 'focus', 'skip'] },
    ],
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'import/extensions': ['error', { ignore: ['.*\\.(scss|less|css)\\?no-css-modules'] }],
    'import/no-restricted-paths': [
        'error',
        {
            basePath: path.resolve(__dirname, 'frontend/src/'),
            // Don't allow importing between different djrad sites
            // Any shared code should go in common.
            zones: [
                {
                    target: './admin',
                    from: './app',
                },
                { target: './driver', from: './app' },
                {
                    target: './app',
                    from: './admin',
                },
                { target: './driver', from: './admin' },
                { target: './admin', from: './driver' },
                { target: './app', from: './driver' },
            ],
        },
    ],
    'react/no-did-update-set-state': 0,
    'import/no-extraneous-dependencies': 0,
    'no-restricted-imports': [
        'error',
        {
            paths: [
                {
                    name: 'lodash',
                    message: 'Please import the specific method required from lodash',
                },
                {
                    name: '@alliance-software/djrad/components/model/ListTableView',
                    message: 'Please import ScbpListTableView instead',
                },
                {
                    name: '@alliance-software/djrad/components/model/ModelForm',
                    message: 'Please import ScbpModelForm instead',
                },
                {
                    name: '@alliance-software/djrad/components/model/FetchListView',
                    message: 'Please use useListView instead',
                },
                {
                    name: '@alliance-software/djrad/components/model/ModelFormProcessor',
                    message: 'Please import useModelFormProcessor instead',
                },
                {
                    name: '@alliance-software/djrad/components/filter/ModelFilterForm',
                    message: 'Please import ScbpModelFilterForm instead',
                },
                {
                    name: '@alliance-software/djrad/components/model/ModelFetchSingle',
                    message: 'Please import useGetModel instead',
                },
            ],
        },
    ],
};

if (lintPrettier) {
    rules['prettier/prettier'] = 'error';
}
module.exports = {
    parser: 'babel-eslint',
    extends: [
        '@alliance-software/eslint-config-react',
        'prettier',
        'prettier/react',
        'plugin:cypress/recommended',
    ],
    plugins: ['react-hooks', lintPrettier && 'prettier', 'cypress', 'no-only-tests'].filter(
        Boolean
    ),
    rules,
    globals,
    env: {
        browser: true,
        node: true,
        jest: true,
        'cypress/globals': true,
    },
    settings: {
        // Used in jest tests - we allow importing from ./frontend/test-utils without prefix
        'import/resolver': {
            node: {
                moduleDirectory: ['node_modules', './frontend/test-utils'],
            },
            webpack: {
                config: path.resolve(path.dirname(__filename), 'frontend/webpack.dev.config.js'),
            },
        },
    },
};
