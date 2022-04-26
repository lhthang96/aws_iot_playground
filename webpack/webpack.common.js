const { resolve } = require("path");
const DotEnv = require("dotenv-webpack");

const config = {
  context: __dirname,
  entry: {
    index: resolve(__dirname, "../src/index.tsx"),
  },
  output: {
    path: resolve(__dirname, "../public"),
    clean: true,
  },
  resolve: {
    extensions: [".js", ".jsx", ".ts", ".tsx"],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "babel-loader",
        exclude: "/node_modules/",
      },
      {
        test: /\.(png|jpe?g|gif)$/i,
        use: [
          {
            loader: "file-loader",
          },
        ],
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  plugins: [new DotEnv()],
};

module.exports = config;
