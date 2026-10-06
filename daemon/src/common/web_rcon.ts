import { isIP } from "net";

export type WebRconErrorCode =
  | "invalidTarget"
  | "missingPassword"
  | "connect"
  | "connectionError"
  | "handshake"
  | "invalidResponse"
  | "timeout"
  | "sendFailed"
  | "closed";

export class WebRconError extends Error {
  constructor(
    public readonly code: WebRconErrorCode,
    public readonly writeConfirmed = false
  ) {
    super(code);
  }
}

// Validate without network I/O and return the encoded connection URL. Never expose it in errors.
export function validateWebRconTarget(host: unknown, port: unknown, password: unknown): string {
  if (typeof host !== "string" || typeof port !== "number") throw new WebRconError("invalidTarget");
  const address = host.trim();
  const bareAddress =
    address.startsWith("[") && address.endsWith("]") ? address.slice(1, -1) : address;
  const ipv6 = isIP(bareAddress) === 6;
  if (
    !address ||
    address.length > 253 ||
    (!ipv6 && !/^[A-Za-z0-9_.-]+$/.test(address)) ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535
  )
    throw new WebRconError("invalidTarget");
  if (typeof password !== "string" || !password) throw new WebRconError("missingPassword");

  try {
    const url = `ws://${ipv6 ? `[${bareAddress}]` : address}:${port}/${encodeURIComponent(
      password
    )}`;
    // URL parsing also rejects malformed numeric addresses; encoding rejects invalid UTF-16.
    new URL(url);
    return url;
  } catch {
    throw new WebRconError("invalidTarget");
  }
}
