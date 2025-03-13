const webpackProjectConfig = require('./webpack.project.config');
const startServer = require('@alliance-software/webpack-dev-utils/server/dev-server');

startServer('127.0.0.1', 3000, webpackProjectConfig.development);
