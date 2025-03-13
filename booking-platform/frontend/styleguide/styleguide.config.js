const path = require('path');
const webpackProjectConfig = require('../webpack.project.config');

const serverHost = '0.0.0.0';
const serverPort = '3011';
const djRadImportStr = './frontend/src/styles/partials/_djrad-vars.less';

const webpackConfigDev = webpackProjectConfig.development({
    serverHost,
    serverPort,
    djRadImportStr,
});
module.exports = {
    require: ['@babel/polyfill'],
    template: {
        head: {
            scripts: [
                {
                    src: 'http://127.0.0.1:8000/frontend-context/',
                },
                {
                    src: 'http://127.0.0.1:8000/__rad__/admin/model-data/',
                },
                {
                    src: 'http://127.0.0.1:8000/__rad__/app/model-data/',
                },
            ],
        },
    },
    pagePerSection: true,
    sections: [
        {
            name: 'Overview',
            content: path.join(__dirname, 'docs/overview.md'),
        },
        {
            name: 'Basics',
            components: path.join(__dirname, 'global-components/**/[A-Z]*.js'),
            description:
                'These components are only to illustrate basic elements for this styleguide, not to be used as components. These elements are good examples of where global styles apply.',
            exampleMode: 'hide',
        },
        {
            name: 'Theme',
            components: path.join(__dirname, 'theme-styles/**/[A-Z]*.js'),
            description:
                'Colours and styles pulled in from the Ant framework default theme. You can change these in the _variables.less partial. Ref: https://github.com/ant-design/ant-design/blob/master/components/style/themes/default.less',
            exampleMode: 'hide',
        },
        {
            name: 'Common',
            components: path.join(__dirname, '../src/common/**/[A-Z]*.js'),
        },
        {
            name: 'App Generic Components',
            components: path.join(__dirname, '../src/app/components/**/[A-Z]*.js'),
        },
        {
            name: 'User',
            components: path.join(__dirname, '../src/app/user/**/[A-Z]*.js'),
        },
    ],
    styleguideComponents: {
        StyleGuideRenderer: path.join(__dirname, 'components/StyleGuideRenderer'),
        Preview: path.join(__dirname, 'components/Preview'),
    },
    skipComponentsWithoutExample: true,
    webpackConfig: webpackConfigDev,
    styles: {
        StyleGuide: {
            sidebar: {},
        },
    },
    context: {
        Button: 'antd/lib/button/button',
        Menu: 'antd/lib/menu',
    },
};
