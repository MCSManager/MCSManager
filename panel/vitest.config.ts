import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    extensions: [".ts", ".tsx", ".mjs", ".js", ".jsx", ".json"],
    alias: {
      "mcsmanager-common": path.resolve(__dirname, "../common/src/index.ts"),
      "@languages": path.resolve(__dirname, "../languages")
    }
  },
  test: {
    include: ["src/**/*.test.ts", "test/**/*.test.ts"],
    environment: "node",
    passWithNoTests: true
  }
});
