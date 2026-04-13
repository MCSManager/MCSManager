import assert from "node:assert/strict";
import test from "node:test";
import { McsmToolHandlers } from "./tools.js";
import { createOverviewFixture, createTestConfig } from "./testFixtures.js";

class FakeClient {
  actionCalls: Array<{ daemonId: string; instanceUuid: string; action: string }> = [];
  overview = createOverviewFixture();

  async getMonitorOverview() {
    return this.overview;
  }

  async performInstanceAction(daemonId: string, instanceUuid: string, action: string) {
    this.actionCalls.push({ daemonId, instanceUuid, action });
    return { ok: true };
  }
}

test("McsmToolHandlers prepares then confirms restart action", async () => {
  const client = new FakeClient();
  const handlers = new McsmToolHandlers(createTestConfig(), client);

  const prepared = await handlers.callTool("mcsm_prepare_instance_action", {
    instanceUuid: "uuid-ce1",
    action: "restart"
  });
  const preparedText = prepared.content[0].text;
  const code = preparedText.match(/确认码：([A-F0-9]+)/)?.[1];
  assert.ok(code);

  const confirmed = await handlers.callTool("mcsm_confirm_instance_action", {
    confirmationCode: code
  });

  assert.equal("isError" in confirmed, false);
  assert.match(confirmed.content[0].text, /已执行 重启/);
  assert.deepEqual(client.actionCalls, [
    {
      daemonId: "daemon-a",
      instanceUuid: "uuid-ce1",
      action: "restart"
    }
  ]);
});

test("McsmToolHandlers does not execute action for ambiguous instance name", async () => {
  const client = new FakeClient();
  const handlers = new McsmToolHandlers(createTestConfig(), client);

  const result = await handlers.callTool("mcsm_prepare_instance_action", {
    instanceName: "ce",
    action: "restart"
  });

  assert.equal(client.actionCalls.length, 0);
  assert.match(result.content[0].text, /匹配到多个实例/);
});
