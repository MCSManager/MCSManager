/* eslint-disable no-undef */
const path = require("path");
const nodeExternals = require("webpack-node-externals");

module.exports = {
  mode: "production",
  entry: "./dist/app.js",
  target: "node",
  externalsPresets: { node: true },
  externals: [nodeExternals()],
  output: {
    filename: "app.js",
    path: path.resolve(__dirname, "production")
  }
};
