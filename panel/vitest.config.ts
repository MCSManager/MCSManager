import path from "path";
import { defineConfig } from "vitest/config";

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
    exclude: ["**/node_modules/**", "**/dist/**"],
    environment: "node",
    passWithNoTests: true
  }
});
