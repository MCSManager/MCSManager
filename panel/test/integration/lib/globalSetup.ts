import { startAll, stopAll, type Runtime } from "./bootstrap";

// vitest globalSetup runs once before all tests (in the main process) and its
// teardown runs once after all tests, even on failure — the correct place to
// bootstrap + tear down the real daemon/panel processes.
let rt: Runtime | null = null;

export async function setup() {
  rt = await startAll();
}

export async function teardown() {
  if (rt) {
    await stopAll(rt);
    rt = null;
  }
}
