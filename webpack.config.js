const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
    mode: "development",
    entry: "./src/index.js", // bundle's entry point
    output: {
        path: path.resolve(__dirname, 'static'), // output directory
        filename: "[name].js" // name of the generated bundle
    },
    devtool: 'source-map',
    devServer: {
        static: 'static',
    },
    plugins: [
        new HtmlWebpackPlugin({
            title: 'Greenfield Compositor Demo',
        }),
    ]
}
