import assert from "node:assert/strict";
import test from "node:test";
import { ConfirmationStore } from "./confirmationStore.js";
import { createOverviewFixture } from "./testFixtures.js";

test("ConfirmationStore consumes confirmation once", () => {
  const overview = createOverviewFixture();
  const store = new ConfirmationStore(60000);
  const instance = overview.servers[0];

  const record = store.prepare(instance, "restart", 1000);
  const consumed = store.consume(record.code.toLowerCase(), overview, 2000);

  assert.equal(consumed.record.instanceUuid, instance.instanceId);
  assert.throws(() => store.consume(record.code, overview, 3000), /不存在或已使用/);
});

test("ConfirmationStore rejects expired confirmation", () => {
  const overview = createOverviewFixture();
  const store = new ConfirmationStore(1000);
  const record = store.prepare(overview.servers[0], "restart", 1000);

  assert.throws(() => store.consume(record.code, overview, 3000), /已过期/);
});

test("ConfirmationStore validates target state before prepare", () => {
  const overview = createOverviewFixture();
  const store = new ConfirmationStore(60000);

  assert.throws(() => store.prepare(overview.servers[0], "start"), /已在运行/);
  assert.throws(() => store.prepare(overview.servers[1], "restart"), /未运行/);
  assert.throws(() => store.prepare(overview.servers[2], "start"), /节点不可用/);
});
