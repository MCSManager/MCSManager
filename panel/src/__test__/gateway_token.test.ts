import { describe, expect, it, beforeAll, beforeEach } from "vitest";

// Import the module under test. `systemConfig` is null until `initSystemConfig()`
// runs — in the test environment we call it once to create the singleton.
import { initSystemConfig, systemConfig } from "../app/setting";
import {
  issueProxyToken,
  verifyProxyToken,
  revokeStreamNonce,
  DOWNLOAD_TTL_SEC,
  STREAM_TTL_SEC
} from "../app/service/gateway_token";

const TEST_SECRET = "test-gateway-secret-fixed-0123456789abcdef";

// Ensure the `systemConfig` singleton is initialised exactly once before the
// suite. Without this, `systemConfig` remains null (it is only initialised in
// `main()` which does not run under vitest).
beforeAll(() => {
  initSystemConfig();
});

beforeEach(() => {
  // Ensure a deterministic secret for every test.
  systemConfig!.gatewaySecret = TEST_SECRET;
});

describe("gateway_token — sign & verify round-trip", () => {
  it("verifies a valid download token and returns the correct binding", () => {
    const token = issueProxyToken({
      daemonId: "daemon-1",
      instanceUuid: "inst-1",
      op: "download",
      target: "world.tar.gz",
      ttlSec: 120
    });
    const binding = verifyProxyToken(token, "download");
    expect(binding).not.toBeNull();
    expect(binding!.daemonId).toBe("daemon-1");
    expect(binding!.instanceUuid).toBe("inst-1");
    expect(binding!.op).toBe("download");
    expect(binding!.target).toBe("world.tar.gz");
  });

  it("verifies a valid upload token", () => {
    const token = issueProxyToken({
      daemonId: "daemon-2",
      instanceUuid: "inst-2",
      op: "upload",
      target: "/data/uploads",
      ttlSec: 60
    });
    const binding = verifyProxyToken(token, "upload");
    expect(binding).not.toBeNull();
    expect(binding!.daemonId).toBe("daemon-2");
    expect(binding!.target).toBe("/data/uploads");
  });
});

describe("gateway_token — rejection cases", () => {
  it("returns null for a tampered signature", () => {
    const token = issueProxyToken({
      daemonId: "daemon-1",
      instanceUuid: "inst-1",
      op: "download",
      target: "file.txt"
    });
    // Corrupt the FIRST character of the base64url signature (all of its 6
    // bits are significant). Flipping the LAST character is NOT deterministic:
    // an unpadded base64url SHA-256 digest ends with 4 significant + 2 ignored
    // bits, so an A/B swap there decodes to the same bytes with probability
    // 4/64 and the tampered token would still verify.
    const sigStart = token.lastIndexOf(".") + 1;
    const first = token[sigStart] === "A" ? "B" : "A";
    const tampered = token.slice(0, sigStart) + first + token.slice(sigStart + 1);
    expect(verifyProxyToken(tampered, "download")).toBeNull();
  });

  it("returns null for a tampered payload", () => {
    const token = issueProxyToken({
      daemonId: "daemon-1",
      instanceUuid: "inst-1",
      op: "download",
      target: "file.txt"
    });
    // Corrupt the first character of the base64url payload.
    const first = token[0] === "A" ? "B" : "A";
    const tampered = first + token.slice(1);
    expect(verifyProxyToken(tampered, "download")).toBeNull();
  });

  it("returns null for a wrong expectedOp", () => {
    const token = issueProxyToken({
      daemonId: "daemon-1",
      instanceUuid: "inst-1",
      op: "download",
      target: "file.txt"
    });
    expect(verifyProxyToken(token, "upload")).toBeNull();
  });

  it("returns null for an expired token", () => {
    const token = issueProxyToken({
      daemonId: "daemon-1",
      instanceUuid: "inst-1",
      op: "download",
      target: "file.txt",
      ttlSec: 1
    });
    // Manually expire by checking after one second — but use a deterministic
    // approach: issue with ttlSec=0 (exp ≈ Date.now()) so it's already expired.
    const expired = issueProxyToken({
      daemonId: "daemon-1",
      instanceUuid: "inst-1",
      op: "download",
      target: "file.txt",
      ttlSec: -1 // exp = Date.now() + (-1000), so already expired
    });
    expect(verifyProxyToken(expired, "download")).toBeNull();
    // The non-expired token should still work.
    expect(verifyProxyToken(token, "download")).not.toBeNull();
  });

  it("returns null for a garbage token", () => {
    expect(verifyProxyToken("not.a.token", "download")).toBeNull();
    expect(verifyProxyToken("", "download")).toBeNull();
    expect(verifyProxyToken("just-no-dot", "download")).toBeNull();
  });
});

describe("gateway_token — single-use replay protection (download/upload)", () => {
  it("a download token cannot be verified twice", () => {
    const token = issueProxyToken({
      daemonId: "daemon-1",
      instanceUuid: "inst-1",
      op: "download",
      target: "file.txt"
    });
    const first = verifyProxyToken(token, "download");
    expect(first).not.toBeNull();

    const second = verifyProxyToken(token, "download");
    expect(second).toBeNull();
  });

  it("an upload token cannot be verified twice", () => {
    const token = issueProxyToken({
      daemonId: "daemon-1",
      instanceUuid: "inst-1",
      op: "upload",
      target: "/uploads"
    });
    const first = verifyProxyToken(token, "upload");
    expect(first).not.toBeNull();

    const second = verifyProxyToken(token, "upload");
    expect(second).toBeNull();
  });
});

describe("gateway_token — stream connection-level one-time semantics", () => {
  it("first verify succeeds and marks the nonce claimed", () => {
    const token = issueProxyToken({
      daemonId: "daemon-1",
      instanceUuid: "inst-1",
      op: "stream",
      target: "inst-1"
    });
    const binding = verifyProxyToken(token, "stream");
    expect(binding).not.toBeNull();
    expect(binding!.op).toBe("stream");
  });

  it("second concurrent verify of the same stream token fails", () => {
    const token = issueProxyToken({
      daemonId: "daemon-1",
      instanceUuid: "inst-1",
      op: "stream",
      target: "inst-1"
    });
    expect(verifyProxyToken(token, "stream")).not.toBeNull();
    expect(verifyProxyToken(token, "stream")).toBeNull();
  });

  it("revokeStreamNonce cleans up the nonce so it cannot be re-verified", () => {
    const token = issueProxyToken({
      daemonId: "daemon-1",
      instanceUuid: "inst-1",
      op: "stream",
      target: "inst-1"
    });
    // First call claims; then revoke cleans up.
    expect(verifyProxyToken(token, "stream")).not.toBeNull();
    revokeStreamNonce(token);
    // Even if the claimed flag was somehow reset, the nonce is gone.
    expect(verifyProxyToken(token, "stream")).toBeNull();
  });

  it("two different stream tokens for the same instance both work independently", () => {
    const tokenA = issueProxyToken({
      daemonId: "daemon-1",
      instanceUuid: "inst-1",
      op: "stream",
      target: "inst-1"
    });
    const tokenB = issueProxyToken({
      daemonId: "daemon-1",
      instanceUuid: "inst-1",
      op: "stream",
      target: "inst-1"
    });
    expect(verifyProxyToken(tokenA, "stream")).not.toBeNull();
    expect(verifyProxyToken(tokenB, "stream")).not.toBeNull();
  });
});

describe("gateway_token — TTL constants", () => {
  it("exports the expected defaults", () => {
    expect(DOWNLOAD_TTL_SEC).toBe(120);
    expect(STREAM_TTL_SEC).toBe(300);
  });
});
