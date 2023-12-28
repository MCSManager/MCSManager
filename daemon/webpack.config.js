const path = require("path");
const nodeExternals = require("webpack-node-externals");

module.exports = {
  mode: "production",
  entry: "./dist/daemon/src/app.js",
  target: "node",
  externalsPresets: { node: true },
  externals: [
    nodeExternals({
      allowlist: ["common"]
    })
  ],
  output: {
    filename: "app.js",
    path: path.resolve(__dirname, "production")
  },
  resolve: {
    alias: {
      "@languages": path.resolve(__dirname, "../languages")
    }
  }
};
