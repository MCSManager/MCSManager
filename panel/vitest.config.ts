import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node"
  },
  resolve: {
    alias: {
      "mcsmanager-common": fileURLToPath(new URL("../common/src/index.ts", import.meta.url)),
      "@languages": fileURLToPath(new URL("../languages", import.meta.url))
    }
  }
});
