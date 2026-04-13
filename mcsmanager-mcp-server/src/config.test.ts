import assert from "node:assert/strict";
import test from "node:test";
import { loadConfig, normalizePanelBaseUrl } from "./config.js";

test("normalizePanelBaseUrl keeps explicit api path", () => {
  assert.equal(normalizePanelBaseUrl("http://127.0.0.1:23333/api/"), "http://127.0.0.1:23333/api");
});

test("normalizePanelBaseUrl appends api path", () => {
  assert.equal(normalizePanelBaseUrl("http://127.0.0.1:23333"), "http://127.0.0.1:23333/api");
});

test("loadConfig parses required env and defaults", () => {
  const config = loadConfig({
    MCSM_PANEL_BASE_URL: "http://panel.local",
    MCSM_API_KEY: "abc",
    MCSM_ALLOWED_INSTANCE_COMMANDS: "list,tps"
  });

  assert.equal(config.panelBaseUrl, "http://panel.local/api");
  assert.equal(config.apiKey, "abc");
  assert.equal(config.confirmationTtlMs, 60000);
  assert.equal(config.requestTimeoutMs, 5000);
  assert.deepEqual(config.allowedInstanceCommands, ["list", "tps"]);
});
