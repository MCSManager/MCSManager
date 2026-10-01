import { bootRuntime, stopRuntime, type Runtime } from "./lib/bootstrap";
import { loadState } from "./lib/world";

// vitest globalSetup runs once before all tests (in the MAIN process) and its
// teardown runs once after all tests, even on failure — the correct place to
// bootstrap + tear down the real daemon/panel processes.
//
// The test file runs in a FORKED worker, which gets a fresh `world` singleton:
// it inherits the runtime state via world.ts's import-time read of .runtime.json
// (written by bootRuntime's saveState). loadState() below is a no-op on a fresh
// run; it picks up a stale .runtime.json only if a prior invocation crashed
// without teardown and the file leaked.
let rt: Runtime | null = null;

export async function setup() {
  loadState();
  rt = await bootRuntime();
}

export async function teardown() {
  if (rt) {
    await stopRuntime(rt);
    rt = null;
  }
}
