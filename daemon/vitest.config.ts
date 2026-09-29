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
    passWithNoTests: true,
    // Instance_router.integration.test.ts calls process.chdir() to isolate
    // StorageSubsystem.DATA_PATH (derived from process.cwd() at import time),
    // which Node does not support inside worker_threads. Disabling worker
    // threads runs tests in forked child processes instead, where chdir works
    // (same approach as the common/ vitest config).
    threads: false
  }
});
