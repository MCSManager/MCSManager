import assert from "node:assert/strict";
import test from "node:test";
import { resolveInstance } from "./instanceResolver.js";
import { createOverviewFixture } from "./testFixtures.js";

test("resolveInstance prefers uuid exact match", () => {
  const result = resolveInstance(createOverviewFixture(), {
    instanceName: "ce1",
    instanceUuid: "uuid-ce2"
  });

  assert.equal(result.type, "found");
  assert.equal(result.type === "found" ? result.instance.instanceName : "", "ce2");
});

test("resolveInstance returns exact name before fuzzy candidates", () => {
  const result = resolveInstance(createOverviewFixture(), { instanceName: "ce1" });

  assert.equal(result.type, "found");
  assert.equal(result.type === "found" ? result.instance.instanceId : "", "uuid-ce1");
});

test("resolveInstance returns ambiguous candidates for fuzzy name", () => {
  const result = resolveInstance(createOverviewFixture(), { instanceName: "ce" });

  assert.equal(result.type, "ambiguous");
});
