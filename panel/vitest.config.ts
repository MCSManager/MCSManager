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
    // The black-box integration suite (test/integration/) needs its OWN
    // config + globalSetup to boot a real daemon+panel. Collecting it here
    // would run it without that setup and fail. Run it via
    // `npm run test:integration` instead.
    exclude: ["**/node_modules/**", "**/dist/**", "test/integration/**"],
    environment: "node",
    passWithNoTests: true
  }
});
