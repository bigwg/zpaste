const {
    override,
    disableEsLint,
    addWebpackResolve
} = require("customize-cra");

module.exports = override(
    // usual webpack plugin
    addWebpackResolve({
        fallback: {
            path: require.resolve('path-browserify'),
            util: require.resolve('util/'),
        }
    })
);