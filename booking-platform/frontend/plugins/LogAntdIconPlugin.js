const camelCase = require('lodash/camelCase');
const upperFirst = require('lodash/upperFirst');
const fs = require('fs');
const { resolve } = require('path');

// Maps a theme value passed to the `Icon` component to the suffix used in component names
// Eg <Icon theme="outline" type="Control" /> becomes `ControlOutline`
const themeToSuffixMap = {
    outline: 'Outline',
    twoTone: 'TwoTone',
    filled: 'Fill',
};
/**
 * Plugin that tells you when you have used an Icon that won't work due to the
 * webpack alias set in webpack.generic.config.js. The alias makes it so all icons
 * come from antd-icons.js so only the explictly exported ones there will work. This
 * is to reduce bundle size.
 */
module.exports = () => ({
    visitor: {
        JSXOpeningElement(path) {
            // TODO: Assumes only imported as Icon... fragile
            if (path.node.name.name === 'Icon') {
                const attrs = path.node.attributes.reduce((acc, attr) => {
                    acc[attr.name.name] = attr.value.value;
                    return acc;
                }, {});
                const { type, theme } = attrs;
                const suffix = themeToSuffixMap[theme || 'outline'];
                if (!suffix) {
                    throw new Error(`Unknown theme ${theme}`);
                }
                const iconName = `${upperFirst(camelCase(type))}${suffix}`;
                const dirName = suffix.toLowerCase();
                const p = `@ant-design/icons/lib/${dirName}/${iconName}`;
                const content = fs.readFileSync(resolve(__dirname, '../src/antd-icons.js'), {
                    encoding: 'utf8',
                });
                if (content.indexOf(p) === -1) {
                    throw new Error(`You must add the following to antd-icons.js in order to avoid including all of antd icons:

export { default as ${iconName} } from '${p}';

`);
                }
            }
        },
    },
});
