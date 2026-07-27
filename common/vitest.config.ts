import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
    // system_storage.test.ts calls process.chdir(), which Node does not
    // support inside worker_threads (vitest's default execution mode on
    // this version). Disabling worker threads runs tests in the main
    // process instead, where chdir is supported.
    threads: false
  }
});
