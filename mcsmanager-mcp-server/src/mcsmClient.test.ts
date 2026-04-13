import assert from "node:assert/strict";
import test from "node:test";
import { McsmClient } from "./mcsmClient.js";
import { createOverviewFixture, createTestConfig } from "./testFixtures.js";

test("McsmClient sends x-request-api-key header", async () => {
  let capturedUrl = "";
  let capturedApiKey = "";
  const fetchImpl = async (input: string | URL | Request, init?: RequestInit) => {
    capturedUrl = String(input);
    capturedApiKey = String((init?.headers as Record<string, string>)["x-request-api-key"]);
    return new Response(JSON.stringify(createOverviewFixture()), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  };

  const client = new McsmClient(createTestConfig(), fetchImpl as typeof fetch);
  await client.getMonitorOverview();

  assert.equal(capturedUrl, "http://127.0.0.1:23333/api/monitor/servers");
  assert.equal(capturedApiKey, "test-api-key");
});

test("McsmClient sends protected instance action request", async () => {
  let capturedUrl = "";
  let capturedMethod = "";
  const fetchImpl = async (input: string | URL | Request, init?: RequestInit) => {
    capturedUrl = String(input);
    capturedMethod = String(init?.method);
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  };

  const client = new McsmClient(createTestConfig(), fetchImpl as typeof fetch);
  await client.performInstanceAction("daemon-a", "uuid-ce1", "restart");

  assert.equal(capturedMethod, "POST");
  assert.equal(
    capturedUrl,
    "http://127.0.0.1:23333/api/protected_instance/restart?daemonId=daemon-a&uuid=uuid-ce1"
  );
});
