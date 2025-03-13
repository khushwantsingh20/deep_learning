const { execSync } = require('child_process');

// Extract from backend djrad static data and our app specific context to use in tests
const djradJsonRaw = execSync(
    'cd django-root && DISABLE_DJRAD_DEVTOOLS=True ./manage.py generate_site_json',
    {
        encoding: 'utf-8',
    }
);

const { admin, app, appContext } = JSON.parse(djradJsonRaw);

const djradConfig = {
    apps: {
        admin,
        app,
    },
};
module.exports = {
    moduleDirectories: ['node_modules', './frontend/test-utils/'],
    testPathIgnorePatterns: ['node_modules', 'venv'],
    setupFilesAfterEnv: [
        '@babel/polyfill',
        'jest-dom/extend-expect',
        '@testing-library/react/cleanup-after-each',
    ],
    globals: {
        __DEBUG__: false,
        __APP_CONTEXT__: appContext,
        __RAD__: djradConfig,
    },
    transformIgnorePatterns: ['/node_modules/(?!@alliance-software/djrad).+\\.js$'],
    moduleNameMapper: {
        // Support css-modules - styles object will be returned as-is (e.g., styles.foobar === 'foobar')
        '\\.(css|less)$': 'identity-obj-proxy',
    },
};
