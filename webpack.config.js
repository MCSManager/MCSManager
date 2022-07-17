/* eslint-disable no-undef */
const path = require('path');
const nodeExternals = require('webpack-node-externals')

module.exports = {
  mode: "production",
  entry: './dist/app.js',
  target: 'node',
  externalsPresets: { node: true }, // in order to ignore built-in modules like path, fs, etc.
  externals: [nodeExternals()], // in order to ignore all modules in node_modules folder
  output: {
    filename: 'app.js',
    path: path.resolve(__dirname, 'production'),
  },
};