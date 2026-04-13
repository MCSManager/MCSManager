import assert from "node:assert/strict";
import test from "node:test";
import { McsmToolHandlers } from "./tools.js";
import { createOverviewFixture, createTestConfig } from "./testFixtures.js";

class FakeClient {
  actionCalls: Array<{ daemonId: string; instanceUuid: string; action: string }> = [];
  commandCalls: Array<{ daemonId: string; instanceUuid: string; command: string }> = [];
  overview = createOverviewFixture();

  async getMonitorOverview() {
    return this.overview;
  }

  async performInstanceAction(daemonId: string, instanceUuid: string, action: string) {
    this.actionCalls.push({ daemonId, instanceUuid, action });
    return { ok: true };
  }

  async performInstanceCommand(daemonId: string, instanceUuid: string, command: string) {
    this.commandCalls.push({ daemonId, instanceUuid, command });
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

test("McsmToolHandlers list instances supports instanceName filter", async () => {
  const client = new FakeClient();
  const handlers = new McsmToolHandlers(createTestConfig(), client);

  const result = await handlers.callTool("mcsm_list_instances", {
    instanceName: "ce1"
  });

  assert.match(result.content[0].text, /ce1/);
  assert.match(result.content[0].text, /ce1-copy/);
  assert.doesNotMatch(result.content[0].text, /ce2/);
});

test("McsmToolHandlers returns health report", async () => {
  const client = new FakeClient();
  const handlers = new McsmToolHandlers(createTestConfig(), client);

  const result = await handlers.callTool("mcsm_get_health_report", {});

  assert.match(result.content[0].text, /MCSManager 健康报告/);
  assert.match(result.content[0].text, /节点资源/);
  assert.match(result.content[0].text, /实例状态/);
  assert.match(result.content[0].text, /异常摘要/);
});

test("McsmToolHandlers lists abnormal instances", async () => {
  const client = new FakeClient();
  client.overview.servers[0].plugin.tps.oneMin = 16;
  const handlers = new McsmToolHandlers(createTestConfig(), client);

  const result = await handlers.callTool("mcsm_get_abnormal_instances", {
    minTps: 18
  });

  assert.match(result.content[0].text, /MCSManager 异常实例列表/);
  assert.match(result.content[0].text, /ce1/);
  assert.match(result.content[0].text, /TPS 16 低于 18/);
});

test("McsmToolHandlers rejects command when allowlist is empty", async () => {
  const client = new FakeClient();
  const handlers = new McsmToolHandlers(createTestConfig(), client);

  const result = await handlers.callTool("mcsm_send_allowed_command", {
    instanceUuid: "uuid-ce1",
    command: "say hello"
  });

  assert.equal("isError" in result ? result.isError : false, true);
  assert.match(result.content[0].text, /未开放任何控制台命令/);
  assert.equal(client.commandCalls.length, 0);
});

test("McsmToolHandlers sends allowed command", async () => {
  const client = new FakeClient();
  const handlers = new McsmToolHandlers(
    createTestConfig({ allowedInstanceCommands: ["list", "tps", "say"] }),
    client
  );

  const result = await handlers.callTool("mcsm_send_allowed_command", {
    instanceUuid: "uuid-ce1",
    command: "/say hello"
  });

  assert.equal("isError" in result, false);
  assert.match(result.content[0].text, /已发送白名单控制台命令/);
  assert.deepEqual(client.commandCalls, [
    {
      daemonId: "daemon-a",
      instanceUuid: "uuid-ce1",
      command: "say hello"
    }
  ]);
});

test("McsmToolHandlers rejects command with newline", async () => {
  const client = new FakeClient();
  const handlers = new McsmToolHandlers(
    createTestConfig({ allowedInstanceCommands: ["say"] }),
    client
  );

  const result = await handlers.callTool("mcsm_send_allowed_command", {
    instanceUuid: "uuid-ce1",
    command: "say hello\nstop"
  });

  assert.equal("isError" in result ? result.isError : false, true);
  assert.match(result.content[0].text, /不能包含换行/);
  assert.equal(client.commandCalls.length, 0);
});
