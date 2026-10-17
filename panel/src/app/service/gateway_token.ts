import crypto from "crypto";
import { v4 } from "uuid";
import { logger } from "./log";
import { systemConfig, saveSystemConfig } from "../setting";

// --------------------------------------------------------------------------
// Panel-signed HMAC proxy data-plane tokens (symmetric, no key distribution).
//
// The panel signs a short-lived token that the browser uses to reach download,
// upload and terminal-stream proxy routes exposed by the panel itself. The
// panel is the sole signer AND verifier — the secret never leaves the panel.
//
// download / upload tokens are single-use: the nonce is deleted the instant
// the token is verified, so a replay against the same URL is impossible.
//
// stream tokens are *connection-level* one-time: the first verify marks the
// nonce `claimed` (a second concurrent verify returns null), but the nonce is
// NOT deleted until the terminal bridge calls `revokeStreamNonce` when the
// last browser subscriber disconnects, or until the TTL sweeper gathers it.
// --------------------------------------------------------------------------

// Default token lifetimes (seconds). Tunable by callers but these cover all
// current call sites: download/upload get a generous 2 minutes; stream gets
// 5 minutes (the browser opens it immediately anyway).
export const DOWNLOAD_TTL_SEC = 120;
export const UPLOAD_TTL_SEC = 120;
export const STREAM_TTL_SEC = 300;

type ProxyOp = "download" | "upload" | "stream";

interface ProxyPayload {
  daemonId: string;
  instanceUuid: string;
  op: ProxyOp;
  target: string;
  nonce: string;
  exp: number;
}

export interface ProxyBinding {
  daemonId: string;
  instanceUuid: string;
  op: ProxyOp;
  target: string;
}

interface NonceEntry {
  exp: number;
  claimed: boolean;
}

// In-module singleton nonce store: nonce → entry.
const nonceStore = new Map<string, NonceEntry>();

const NONCE_SWEEP_INTERVAL_MS = 60_000;
let sweepTimer: NodeJS.Timeout | null = null;

function ensureSweeper(): void {
  if (sweepTimer) return;
  sweepTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of nonceStore) {
      if (now > entry.exp) nonceStore.delete(key);
    }
  }, NONCE_SWEEP_INTERVAL_MS);
  // Don't keep the event loop alive solely for nonce housekeeping.
  if (sweepTimer && typeof sweepTimer.unref === "function") sweepTimer.unref();
}

/**
 * Returns the HMAC signing secret, generating and persisting one lazily if the
 * config does not yet have `gatewaySecret` set. Always reads from the live
 * `systemConfig` singleton (hot-reload-safe).
 */
function getSecret(): string {
  let secret = systemConfig?.gatewaySecret ?? "";
  if (!secret) {
    secret = v4().replace(/-/g, "");
    if (systemConfig) {
      systemConfig.gatewaySecret = secret;
      saveSystemConfig(systemConfig);
      logger.info("Gateway token secret auto-generated and persisted.");
    }
  }
  return secret;
}

/**
 * Issue a signed proxy token for one of the three data-plane operations.
 * The token is only usable for the call site that registered it.
 */
export function issueProxyToken(params: {
  daemonId: string;
  instanceUuid: string;
  op: ProxyOp;
  target: string;
  ttlSec?: number;
}): string {
  const defaultTtl = params.op === "stream" ? STREAM_TTL_SEC : DOWNLOAD_TTL_SEC;
  const ttlSec = params.ttlSec ?? defaultTtl;
  const nonce = v4().replace(/-/g, "");
  const exp = Date.now() + ttlSec * 1000;

  const payload: ProxyPayload = {
    daemonId: params.daemonId,
    instanceUuid: params.instanceUuid,
    op: params.op,
    target: params.target,
    nonce,
    exp
  };

  const payloadJson = JSON.stringify(payload);
  const secret = getSecret();
  const sig = crypto.createHmac("sha256", secret).update(payloadJson).digest();
  const token = Buffer.from(payloadJson).toString("base64url") + "." + sig.toString("base64url");

  ensureSweeper();
  nonceStore.set(nonce, { exp, claimed: false });
  return token;
}

/**
 * Verify a proxy token. For download/upload, the nonce is consumed (deleted) on
 * success — those operations are single-use. For stream, the nonce is marked
 * `claimed` but NOT deleted; `revokeStreamNonce` is used by the terminal bridge
 * once the live browser connection is gone.
 *
 * Returns the binding on success, or `null` for any failure (bad signature,
 * wrong op, expired, unknown/claimed nonce, malformed token). Never throws.
 */
export function verifyProxyToken(token: string, expectedOp: ProxyOp): ProxyBinding | null {
  try {
    const dotIdx = token.lastIndexOf(".");
    if (dotIdx < 1) return null;
    const payloadB64 = token.slice(0, dotIdx);
    const sigB64 = token.slice(dotIdx + 1);

    const payloadJson = Buffer.from(payloadB64, "base64url").toString();
    const payload: ProxyPayload = JSON.parse(payloadJson);

    // Constant-time HMAC check
    const secret = getSecret();
    const expectedSig = crypto.createHmac("sha256", secret).update(payloadJson).digest();
    const providedSig = Buffer.from(sigB64, "base64url");
    if (expectedSig.length !== providedSig.length) return null;
    if (!crypto.timingSafeEqual(expectedSig, providedSig)) return null;

    if (payload.op !== expectedOp) return null;
    if (Date.now() > payload.exp) return null;

    const entry = nonceStore.get(payload.nonce);
    if (!entry) return null;
    // The exp on the nonce must match the payload — prevents resigning tricks.
    if (payload.exp !== entry.exp) return null;

    if (expectedOp === "stream") {
      // Stream tokens are connection-level: first caller claims the nonce,
      // second concurrent caller is rejected. The nonce stays until the bridge
      // revokes it (or it expires).
      if (entry.claimed) return null;
      entry.claimed = true;
      return {
        daemonId: payload.daemonId,
        instanceUuid: payload.instanceUuid,
        op: payload.op,
        target: payload.target
      };
    }

    // download / upload: single-use → delete nonce now.
    nonceStore.delete(payload.nonce);
    return {
      daemonId: payload.daemonId,
      instanceUuid: payload.instanceUuid,
      op: payload.op,
      target: payload.target
    };
  } catch (err) {
    logger.warn("verifyProxyToken failed:", (err as Error)?.message ?? err);
    return null;
  }
}

/**
 * Delete the nonce backing a stream token. Called by the terminal bridge when
 * the last browser subscriber for a (daemonId, instanceUuid) pair disconnects,
 * so the token can never be reused to open a second independent stream.
 */
export function revokeStreamNonce(token: string): void {
  try {
    const dotIdx = token.lastIndexOf(".");
    if (dotIdx < 1) return;
    const payloadB64 = token.slice(0, dotIdx);
    const payloadJson = Buffer.from(payloadB64, "base64url").toString();
    const payload: ProxyPayload = JSON.parse(payloadJson);
    nonceStore.delete(payload.nonce);
  } catch {
    // best-effort cleanup
  }
}

export default { issueProxyToken, verifyProxyToken, revokeStreamNonce };
