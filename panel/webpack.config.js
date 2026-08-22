const path = require("path");
const fs = require("fs");
const nodeExternals = require("webpack-node-externals");

/**
 * Optional native-acceleration packages that are loaded by their consumers
 * inside try/catch with a pure-JS fallback (e.g. ws / socket.io). We never want
 * webpack to bundle a `.node` binary, so in bundle mode these stay external.
 * At runtime they are simply absent and the consumer falls back to pure JS.
 */
const OPTIONAL_NATIVE_EXTERNALS = ["bufferutil", "utf-8-validate", "cpu-features"];

/**
 * BUNDLE=1 => production packaging: inline the entire dependency tree (every
 * npm package + all language packs via the static `@languages` imports) so the
 * emitted app.js runs with bare `node` and no `node_modules` installed.
 * Otherwise (dev) keep deps external for fast incremental rebuilds.
 */
const BUNDLE = process.env.BUNDLE === "1";

/**
 * Externalize native `.node` binary requires (e.g. ssh2's `sshcrypto.node`) as
 * CommonJS so webpack emits `module.exports = require("...")` instead of trying
 * to parse the binary (build error) or emitting invalid JS. These binaries are
 * pure acceleration: their consumers load them inside `try { } catch { }` and
 * fall back to pure JS. At runtime the require throws MODULE_NOT_FOUND (no
 * node_modules shipped) and the consumer catches it -> pure-JS path.
 */
function externalNativeNodeBinary({ request }, callback) {
  if (typeof request === "string" && /\.node$/.test(request)) {
    return callback(null, { commonjs: request });
  }
  callback();
}

/**
 * Auto-detect ESM-only packages and bundle them
 * instead of externalizing with require()
 */
function isEsmPackage(moduleName) {
  try {
    const parts = moduleName.split("/");
    const pkgName = moduleName.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0];
    const pkgJsonPath = path.join(__dirname, "node_modules", pkgName, "package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));
    return pkg.type === "module";
  } catch {
    return false;
  }
}

/**
 * @type {import('webpack').Configuration}
 */
module.exports = {
  mode: "production",
  entry: "./src/app.ts",
  module: {
    rules: [
      {
        test: /\.ts/,
        use: "ts-loader",
        exclude: /node_modules/
      }
    ]
  },
  target: "node",
  devtool: "source-map",
  optimization: {
    chunkIds: "named",
    minimize: false,
    mangleExports: false,
    moduleIds: "named"
  },
  externalsPresets: { node: true },
  externals: BUNDLE
    ? [...OPTIONAL_NATIVE_EXTERNALS, externalNativeNodeBinary]
    : [
        nodeExternals({
          allowlist: ["mcsmanager-common", isEsmPackage]
        })
      ],
  output: {
    filename: "app.js",
    path: path.resolve(__dirname, "production")
  },
  resolve: {
    extensions: [".ts", ".js"],
    alias: {
      "@languages": path.resolve(__dirname, "../languages"),
      "mcsmanager-common": path.resolve(__dirname, "../common/src/index.ts")
    }
  }
};
