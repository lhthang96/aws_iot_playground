const { resolve } = require("path");
const { merge } = require("webpack-merge");
const common = require("./webpack.common");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");

module.exports = merge(common, {
  mode: "development",
  output: {
    filename: "[name].bundle.js",
  },
  devServer: {
    port: 8000,
    open: true,
    hot: true,
    compress: true,
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: resolve(__dirname, "./templates/index.dev.html"),
      filename: "index.html",
      inject: "body",
    }),
    new BundleAnalyzerPlugin(),
  ],
});
