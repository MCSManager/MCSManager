import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// One vitest invocation PER suite file (the runner calls vitest once per file).
// globalSetup boots a fresh daemon+panel pair for that invocation and tears it down
// in teardown. Because each invocation has exactly one file, the it blocks run
// sequentially by default and share one in-memory `world` — sidestepping vitest 0.33's
// ignored singleFork (multiple files would race the shared ports/state).
//
// root = common/ (parent of test/integration/) so the root-relative
// `include` ("test/integration/suites/**") matches real files. The panel config
// uses the same shape (root=panel/, include="test/integration/**").
export default defineConfig({
  root: path.resolve(__dirname, "../.."),
  test: {
    include: ["test/integration/suites/**/*.test.ts"],
    environment: "node",
    globalSetup: path.resolve(__dirname, "globalSetup.ts"),
    testTimeout: 180000,
    hookTimeout: 180000,
    passWithNoTests: false
  }
});
