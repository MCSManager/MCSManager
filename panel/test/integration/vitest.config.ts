import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Dedicated config for the black-box integration suite.
// - root = panel/ ; include only the integration tests.
// - pool forks + singleFork + isolate:false => one forked process runs ALL
//   test files sequentially and shares the module registry, so the `world`
//   singleton (and the panel/daemon child processes it spawned) persist across
//   files in deterministic (alphabetical) order.
// - globalSetup boots the real daemon+panel (panel with
//   --unsafe-integration-test-mode) and tears them down even on failure.
export default defineConfig({
  root: path.resolve(__dirname, "../.."),
  test: {
    include: ["test/integration/**/*.test.ts"],
    environment: "node",
    pool: "forks",
    poolOptions: { forks: { singleFork: true } },
    isolate: false,
    fileParallelism: false,
    globalSetup: path.resolve(__dirname, "lib/globalSetup.ts"),
    testTimeout: 180000,
    hookTimeout: 180000,
    passWithNoTests: false
  }
});
