import { describe, it, expect } from "vitest";
import { world, requestPanel, loginSessionRetry, ensureUser } from "../lib";

// De-risk gate for the integration framework.
//
// Boots a REAL daemon + panel (via globalSetup's bootRuntime) and proves the
// whole stack end-to-end: the integration-test key hits the public readiness
// probe (/auth/status 200) and the panel has registered the local daemon; then
// a real admin is created, logged in through the real /auth/login cookie
// handshake, and shows up in /auth/overview.
//
// If this is green, the framework (boot + key + http + login bridge) is proven
// and the six module suites (T5–T10) can fan out safely on top of it.
describe("framework smoke", () => {
  it("boots: key hits /auth/status 200 and the local daemon is registered", async () => {
    const r = await requestPanel({ method: "GET", path: "/auth/status", key: world.key });
    expect(r.httpStatus).toBe(200);
    expect(world.daemonId).toBeTruthy();
  });

  it("real login: admin can log in and read /auth/overview", async () => {
    await ensureUser("admin", world.key); // create-or-verify test_admin (perm 10)
    const s = await loginSessionRetry("admin"); // real cookie + token
    expect(s.cookie.length).toBeGreaterThan(0);
    const ov = await requestPanel({ method: "GET", path: "/auth/overview", key: world.key });
    expect(ov.httpStatus).toBe(200);
    expect((ov.data || []).some((u: any) => u.userName === world.admin.name)).toBe(true);
  });
});
