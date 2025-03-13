const process = require('process');

const disableSentry = process.argv.includes('--disable-sentry');

const webpackGenericConfig = require('./webpack.generic.config');

const commonSettings = {
    // insert project-specific settings here
    bootstrap: false,
    jQuery: false,
    react: true,
    antd: true,
    // bundle definitions
    entryPoints: {
        admin: ['./src/polyfills.js', './src/sentry.js', './src/admin/index-admin.js'],
        app: ['./src/polyfills.js', './src/sentry.js', './src/app/index-app.js'],
        driver: ['./src/polyfills.js', './src/sentry.js', './src/driver/index-driver.js'],
    },
    vendorPackages: [
        /node_modules\/antd/,
        /node_modules\/alliance-redux-api/,
        /node_modules\/@alliance-software\/djrad/,
        /node_modules\/moment/,
        /node_modules\/immutable/,
        /node_modules\/react/,
        /node_modules\/react-dom/,
        /node_modules\/react-redux/,
        /node_modules\/redux/,
        /node_modules\/redux-form/,
        /node_modules\/react-router/,
        /node_modules\/react-router-dom/,
        /node_modules\/react-helmet/,
    ],
    chunkHash: false,
    analyze: true,
    hotReload: true,
};

module.exports = {
    commonSettings,
    production: () =>
        webpackGenericConfig(
            Object.assign(
                {
                    environment: 'production',
                    includeSentry: !disableSentry,
                    sourceMap: !disableSentry,
                },
                commonSettings
            )
        ),
    development: (extraConfig = {}) =>
        webpackGenericConfig(
            Object.assign(
                {
                    environment: 'development',
                },
                extraConfig,
                commonSettings
            )
        ),
};
