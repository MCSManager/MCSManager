// Pure, dependency-free logic for the per-IP login failure counter and ban.
//
// The counter is a bounded sliding window: failures only accumulate while they
// keep happening within `LOGIN_FAILED_WINDOW_MS` of each other. Once the window
// passes without a new failure, the counter is forgotten. This prevents a
// legitimate IP from being banned by occasional failures spread over a long
// period (the original counter never expired).

export interface IpFailureRecord {
  // Number of accumulated failures inside the current window.
  count: number;
  // Timestamp (ms) of the last failure. Used for window expiry.
  updatedAt: number;
  // Timestamp (ms) of when this IP was banned. Absent when not banned.
  bannedAt?: number;
}

export type FailureDecision = "allow" | "deny";

export interface RegisterFailureOptions {
  // Whether `loginCheckIp` is enabled in the system config. When false the
  // counter is still updated (for statistics/back-compat) but never denies.
  loginCheckIp: boolean;
  now?: number;
  maxFailures?: number;
  windowMs?: number;
  banDurationMs?: number;
}

export interface FailureResult {
  decision: FailureDecision;
  // True only on the request that first triggers the ban, so callers can
  // schedule cleanup once per ban instead of on every denied request.
  newlyBanned: boolean;
}

// Failure counters older than this are ignored.
export const LOGIN_FAILED_WINDOW_MS = 10 * 60 * 1000;
// More than this many failures inside the window triggers a ban.
export const LOGIN_FAILED_MAX = 10;
// How long a banned IP stays blocked.
export const IP_BAN_DURATION_MS = 10 * 60 * 1000;

// Returns the number of still-active failures for a record, or 0 if the record
// is missing or its window has expired.
export function getActiveFailureCount(
  record: IpFailureRecord | undefined,
  now: number,
  windowMs: number = LOGIN_FAILED_WINDOW_MS
): number {
  if (!record) return 0;
  if (now - record.updatedAt >= windowMs) return 0;
  return record.count;
}

// Whether the record is currently inside its ban window.
export function isBanned(
  record: IpFailureRecord | undefined,
  now: number,
  banDurationMs: number = IP_BAN_DURATION_MS
): boolean {
  if (!record || record.bannedAt === undefined) return false;
  return now - record.bannedAt < banDurationMs;
}

// Clears the failure record for an IP. Called on every successful login so
// password and SSO paths behave consistently.
export function resetFailure(ipMap: Record<string, IpFailureRecord>, ip: string): void {
  delete ipMap[ip];
}

export function registerFailureAttempt(
  ipMap: Record<string, IpFailureRecord>,
  ip: string,
  options: RegisterFailureOptions
): FailureResult {
  const {
    loginCheckIp,
    now = Date.now(),
    maxFailures = LOGIN_FAILED_MAX,
    windowMs = LOGIN_FAILED_WINDOW_MS,
    banDurationMs = IP_BAN_DURATION_MS
  } = options;

  // Already banned and still inside the ban window.
  if (loginCheckIp && isBanned(ipMap[ip], now, banDurationMs)) {
    return { decision: "deny", newlyBanned: false };
  }

  const activeCount = getActiveFailureCount(ipMap[ip], now, windowMs);

  if (loginCheckIp && activeCount > maxFailures) {
    ipMap[ip] = { count: activeCount, updatedAt: now, bannedAt: now };
    return { decision: "deny", newlyBanned: true };
  }

  ipMap[ip] = { count: activeCount + 1, updatedAt: now };
  return { decision: "allow", newlyBanned: false };
}
