const { resolve } = require("path");
const { merge } = require("webpack-merge");
const common = require("./webpack.common");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const TerserWebpackPlugin = require("terser-webpack-plugin");
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");

module.exports = merge(common, {
  mode: "production",
  output: {
    filename: "[name].[contenthash].bundle.js",
  },
  optimization: {
    minimizer: [new TerserWebpackPlugin()],
    runtimeChunk: "single",
    splitChunks: {
      chunks: "all",
    },
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: resolve(__dirname, "./templates/index.prod.html"),
      filename: "index.html",
      inject: "body",
    }),
    new BundleAnalyzerPlugin({
      analyzerMode: "static",
    }),
  ],
  /**
   * - `react`
   * - `react-dom`
   * - `rxjs`
   * - `styled-components`
   *
   * Those libraries will be setup using by cdn in ./templates/index.prod.html
   *
   * ### Why?
   *
   * This is another way to reduce app bundle size. In production, those libraries won't be bundled in the
   * main script file. Instead, they will be downloaded via CDN.
   *
   * **Pros**:
   *  - Reduce main bundle size.
   *  - They can easily cached by downloading via CDN.
   *
   * **Cons**:
   *  - Need to frequently check libraries version to make sure app works normally.
   *  - Have to manually setup cdn version in production html template when needed.
   *  - There is a risk by using CDN since it's a third-party service.
   */
  externals: {
    react: "React",
    "react-dom": "ReactDOM",
    rxjs: "rxjs",
    "rxjs/operators": ["rxjs", "operators"],
    "styled-components": "styled",
  },
});
