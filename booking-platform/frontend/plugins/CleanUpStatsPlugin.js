// Taken from https://github.com/webpack-contrib/mini-css-extract-plugin/issues/168#issuecomment-420095982
/**
 * Suppress spam from stats output.
 *
 * mini-css-extract-plugin is extremely verbose with no option to make it quiet.
 * See above issue.
 */
class CleanUpStatsPlugin {
    shouldPickStatChild(child) {
        return child.name.indexOf('mini-css-extract-plugin') !== 0;
    }

    apply(compiler) {
        compiler.hooks.done.tap('CleanUpStatsPlugin', stats => {
            const children = stats.compilation.children;
            if (Array.isArray(children)) {
                // eslint-disable-next-line no-param-reassign
                stats.compilation.children = children.filter(child =>
                    this.shouldPickStatChild(child)
                );
            }
        });
    }
}

module.exports = CleanUpStatsPlugin; // eslint-disable-line
