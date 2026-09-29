import { describe, expect, it } from "vitest";
import {
  getActiveFailureCount,
  IP_BAN_DURATION_MS,
  isBanned,
  LOGIN_FAILED_MAX,
  LOGIN_FAILED_WINDOW_MS,
  registerFailureAttempt,
  resetFailure
} from "./login_ban";
import type { FailureResult, IpFailureRecord } from "./login_ban";

const IP = "203.0.113.7";
const OTHER_IP = "203.0.113.8";
// A fixed reference timestamp so window/ban maths is deterministic.
const T0 = 1_700_000_000_000;
const SECOND = 1000;

function freshMap(): Record<string, IpFailureRecord> {
  return {};
}

// Drives `IP` until registerFailureAttempt first denies it and returns that
// denying result. Throws if it never bans within a sane bound, so a regression
// fails loudly instead of looping forever.
function failUntilBanned(map: Record<string, IpFailureRecord>, now: number = T0): FailureResult {
  for (let i = 0; i < LOGIN_FAILED_MAX + 5; i++) {
    const result = registerFailureAttempt(map, IP, { loginCheckIp: true, now });
    if (result.decision === "deny") return result;
  }
  throw new Error("IP was never banned within the expected number of attempts");
}

describe("getActiveFailureCount", () => {
  it("returns 0 for a missing record", () => {
    expect(getActiveFailureCount(undefined, T0)).toBe(0);
  });

  it("returns the count while inside the window", () => {
    const record: IpFailureRecord = { count: 4, updatedAt: T0 };
    expect(getActiveFailureCount(record, T0)).toBe(4);
    expect(getActiveFailureCount(record, T0 + LOGIN_FAILED_WINDOW_MS - 1)).toBe(4);
  });

  it("forgets the count once the window has elapsed (inclusive boundary)", () => {
    const record: IpFailureRecord = { count: 4, updatedAt: T0 };
    expect(getActiveFailureCount(record, T0 + LOGIN_FAILED_WINDOW_MS)).toBe(0);
    expect(getActiveFailureCount(record, T0 + LOGIN_FAILED_WINDOW_MS * 10)).toBe(0);
  });

  it("still reports the raw count for a currently-banned record", () => {
    const record: IpFailureRecord = { count: 11, updatedAt: T0, bannedAt: T0 };
    expect(getActiveFailureCount(record, T0)).toBe(11);
  });

  it("honours an explicit window override", () => {
    const record: IpFailureRecord = { count: 4, updatedAt: T0 };
    expect(getActiveFailureCount(record, T0 + 999, 1000)).toBe(4);
    expect(getActiveFailureCount(record, T0 + 1000, 1000)).toBe(0);
  });
});

describe("isBanned", () => {
  it("is false when the record was never banned", () => {
    expect(isBanned({ count: 11, updatedAt: T0 }, T0)).toBe(false);
    expect(isBanned(undefined, T0)).toBe(false);
  });

  it("is true inside the ban duration and false once it elapses", () => {
    const record: IpFailureRecord = { count: 11, updatedAt: T0, bannedAt: T0 };
    expect(isBanned(record, T0)).toBe(true);
    expect(isBanned(record, T0 + IP_BAN_DURATION_MS - 1)).toBe(true);
    // Boundary is exclusive: exactly at the duration the ban is over.
    expect(isBanned(record, T0 + IP_BAN_DURATION_MS)).toBe(false);
    expect(isBanned(record, T0 + IP_BAN_DURATION_MS * 2)).toBe(false);
  });

  it("honours an explicit duration override", () => {
    const record: IpFailureRecord = { count: 11, updatedAt: T0, bannedAt: T0 };
    expect(isBanned(record, T0 + 1000, 1001)).toBe(true);
    expect(isBanned(record, T0 + 1000, 1000)).toBe(false);
  });
});

describe("registerFailureAttempt (loginCheckIp enabled)", () => {
  it("allows LOGIN_FAILED_MAX + 1 attempts, then bans the next one", () => {
    const map = freshMap();
    for (let i = 0; i < LOGIN_FAILED_MAX + 1; i++) {
      const result = registerFailureAttempt(map, IP, { loginCheckIp: true, now: T0 });
      expect(result.decision).toBe("allow");
      expect(result.newlyBanned).toBe(false);
    }
    expect(map[IP].count).toBe(LOGIN_FAILED_MAX + 1);
    expect(map[IP].bannedAt).toBeUndefined();

    const banned = registerFailureAttempt(map, IP, { loginCheckIp: true, now: T0 });
    expect(banned.decision).toBe("deny");
    expect(banned.newlyBanned).toBe(true);
    expect(isBanned(map[IP], T0)).toBe(true);
  });

  it("reports newlyBanned exactly once per ban", () => {
    const map = freshMap();
    const firstBan = failUntilBanned(map);
    expect(firstBan.newlyBanned).toBe(true);

    const next1 = registerFailureAttempt(map, IP, { loginCheckIp: true, now: T0 + SECOND });
    const next2 = registerFailureAttempt(map, IP, { loginCheckIp: true, now: T0 + 2 * SECOND });
    expect(next1.decision).toBe("deny");
    expect(next1.newlyBanned).toBe(false);
    expect(next2.decision).toBe("deny");
    expect(next2.newlyBanned).toBe(false);
  });

  it("reports newlyBanned again for a fresh ban after the previous one expired", () => {
    const map = freshMap();
    expect(failUntilBanned(map).newlyBanned).toBe(true);

    const afterExpiry = T0 + IP_BAN_DURATION_MS;
    // The expired ban no longer denies; the counter starts over.
    const allowedAgain = registerFailureAttempt(map, IP, {
      loginCheckIp: true,
      now: afterExpiry
    });
    expect(allowedAgain.decision).toBe("allow");
    expect(map[IP].count).toBe(1);

    const secondBan = failUntilBanned(map, afterExpiry);
    expect(secondBan.newlyBanned).toBe(true);
  });

  it("unbans and resets the counter after the ban duration", () => {
    const map = freshMap();
    failUntilBanned(map);
    expect(isBanned(map[IP], T0)).toBe(true);

    const afterBan = registerFailureAttempt(map, IP, {
      loginCheckIp: true,
      now: T0 + IP_BAN_DURATION_MS
    });
    expect(afterBan.decision).toBe("allow");
    expect(map[IP].count).toBe(1);
    expect(map[IP].bannedAt).toBeUndefined();
    expect(isBanned(map[IP], T0 + IP_BAN_DURATION_MS)).toBe(false);
  });

  it("forgets failures that are older than the window", () => {
    const map = freshMap();
    for (let i = 0; i < LOGIN_FAILED_MAX + 1; i++) {
      registerFailureAttempt(map, IP, { loginCheckIp: true, now: T0 });
    }
    expect(map[IP].count).toBe(LOGIN_FAILED_MAX + 1);

    const afterWindow = registerFailureAttempt(map, IP, {
      loginCheckIp: true,
      now: T0 + LOGIN_FAILED_WINDOW_MS
    });
    expect(afterWindow.decision).toBe("allow");
    expect(map[IP].count).toBe(1);
  });

  it("keeps accumulating failures that stay within the window of the previous one", () => {
    const map = freshMap();
    // Five failures one minute apart: the window slides with the last failure,
    // so none of them expire.
    for (let i = 0; i < 5; i++) {
      registerFailureAttempt(map, IP, { loginCheckIp: true, now: T0 + i * 60 * SECOND });
    }
    expect(map[IP].count).toBe(5);

    const justInsideWindow = registerFailureAttempt(map, IP, {
      loginCheckIp: true,
      now: T0 + 4 * 60 * SECOND + (LOGIN_FAILED_WINDOW_MS - 1)
    });
    expect(justInsideWindow.decision).toBe("allow");
    expect(map[IP].count).toBe(6);
  });

  it("tracks each IP independently", () => {
    const map = freshMap();
    registerFailureAttempt(map, IP, { loginCheckIp: true, now: T0 });
    registerFailureAttempt(map, IP, { loginCheckIp: true, now: T0 });
    registerFailureAttempt(map, OTHER_IP, { loginCheckIp: true, now: T0 });

    expect(map[IP].count).toBe(2);
    expect(map[OTHER_IP].count).toBe(1);
  });

  it("applies custom max/window/ban durations independently", () => {
    const map = freshMap();
    const options = {
      loginCheckIp: true,
      maxFailures: 2,
      windowMs: 1000,
      banDurationMs: 3000
    };

    // maxFailures + 1 allowed, the following one bans.
    for (let i = 0; i < options.maxFailures + 1; i++) {
      registerFailureAttempt(map, IP, { ...options, now: T0 });
    }
    const banned = registerFailureAttempt(map, IP, { ...options, now: T0 });
    expect(banned.decision).toBe("deny");
    expect(banned.newlyBanned).toBe(true);

    // Still banned one tick before banDurationMs.
    const stillBanned = registerFailureAttempt(map, IP, {
      ...options,
      now: T0 + options.banDurationMs - 1
    });
    expect(stillBanned.decision).toBe("deny");
    expect(stillBanned.newlyBanned).toBe(false);

    // At banDurationMs the ban is over and the (window-expired) counter resets.
    const released = registerFailureAttempt(map, IP, {
      ...options,
      now: T0 + options.banDurationMs
    });
    expect(released.decision).toBe("allow");
    expect(map[IP].count).toBe(1);
  });
});

describe("registerFailureAttempt (loginCheckIp disabled)", () => {
  it("never denies, but still counts", () => {
    const map = freshMap();
    for (let i = 0; i < 100; i++) {
      const result = registerFailureAttempt(map, IP, { loginCheckIp: false, now: T0 });
      expect(result.decision).toBe("allow");
      expect(result.newlyBanned).toBe(false);
    }
    expect(map[IP].count).toBe(100);
  });

  it("does not enforce an existing ban", () => {
    const map = freshMap();
    map[IP] = { count: LOGIN_FAILED_MAX + 1, updatedAt: T0, bannedAt: T0 };
    const result = registerFailureAttempt(map, IP, { loginCheckIp: false, now: T0 });
    expect(result.decision).toBe("allow");
    expect(result.newlyBanned).toBe(false);
  });
});

describe("resetFailure", () => {
  it("removes the record so the next failure starts from 1", () => {
    const map = freshMap();
    registerFailureAttempt(map, IP, { loginCheckIp: true, now: T0 });
    registerFailureAttempt(map, IP, { loginCheckIp: true, now: T0 });
    expect(map[IP].count).toBe(2);

    resetFailure(map, IP);
    expect(map[IP]).toBeUndefined();

    const next = registerFailureAttempt(map, IP, { loginCheckIp: true, now: T0 });
    expect(next.decision).toBe("allow");
    expect(map[IP].count).toBe(1);
  });

  it("is a no-op for an unknown IP", () => {
    const map = freshMap();
    expect(() => resetFailure(map, IP)).not.toThrow();
    expect(map[IP]).toBeUndefined();
  });

  it("clears an active ban (successful login wins)", () => {
    const map = freshMap();
    failUntilBanned(map);
    expect(isBanned(map[IP], T0)).toBe(true);

    resetFailure(map, IP);
    expect(map[IP]).toBeUndefined();
    expect(isBanned(map[IP], T0)).toBe(false);
  });
});

// Regression test for https://github.com/MCSManager/MCSManager/issues/2369
describe("issue #2369: successful SSO logins must not accumulate the counter", () => {
  it("keeps the counter at zero across many successful SSO flows", () => {
    const map = freshMap();
    // Each successful SSO cycle hits /authorize (counts a failure) and then
    // the callback (loginSuccess -> resetFailure).
    for (let i = 0; i < 25; i++) {
      const authorize = registerFailureAttempt(map, IP, {
        loginCheckIp: true,
        now: T0 + i * SECOND
      });
      expect(authorize.decision).toBe("allow");
      expect(authorize.newlyBanned).toBe(false);
      expect(map[IP].count).toBe(1);

      resetFailure(map, IP); // loginSuccess
      expect(map[IP]).toBeUndefined();
    }

    // The 26th authorization request is still allowed (was banned before fix).
    const next = registerFailureAttempt(map, IP, { loginCheckIp: true, now: T0 + 25 * SECOND });
    expect(next.decision).toBe("allow");
    expect(next.newlyBanned).toBe(false);
  });

  it("still bans a genuine brute-force attempt without a successful login", () => {
    const map = freshMap();
    const last = failUntilBanned(map);
    expect(last.decision).toBe("deny");
    expect(last.newlyBanned).toBe(true);
  });
});
