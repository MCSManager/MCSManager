import { promises as dns } from "dns";
import { isIP } from "net";

function isPrivateAddress(address: string, family: number): boolean {
  if (family === 6) {
    const normalized = address.toLowerCase();
    return (
      normalized === "::" ||
      normalized === "::1" ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      /^fe[89ab]/.test(normalized) ||
      normalized.startsWith("::ffff:")
    );
  }

  const [first, second] = address.split(".").map(Number);
  return (
    first === 0 ||
    first === 10 ||
    (first === 100 && second >= 64 && second <= 127) ||
    first === 127 ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  );
}

export interface SafeUrlTarget {
  url: URL;
  address: string;
  family: 4 | 6;
}

/**
 * Resolve a URL and return the exact address that was validated.
 *
 * Callers MUST pin this address when opening the connection (for example via
 * Axios' `lookup` option); otherwise the HTTP stack resolves the hostname a
 * second time and an attacker-controlled DNS server can answer with a private
 * address for that second lookup (DNS rebinding / TOCTOU SSRF).
 */
export async function resolveSafeUrl(url: string): Promise<SafeUrlTarget> {
  const urlObj = new URL(url);
  const hostname = urlObj.hostname.toLowerCase();

  // Only allow HTTP and HTTPS protocols
  if (urlObj.protocol !== "http:" && urlObj.protocol !== "https:") {
    throw new Error("Only HTTP and HTTPS URLs are allowed");
  }

  // Reject ip addresses
  if ((hostname.startsWith("[") && hostname.endsWith("]")) || isIP(hostname) !== 0) {
    throw new Error("IP addresses are not allowed");
  }

  // Reject local domains
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local")
  ) {
    throw new Error("Local domains are not allowed");
  }

  // Must contain at least one dot (ensure it's a valid domain, not a single word)
  if (!hostname.includes(".")) {
    throw new Error("Hostname must contain a dot");
  }

  // Domain must have at least a top-level domain (exclude single dot cases)
  const parts = hostname.split(".");
  if (parts.length < 2 || parts.some((part) => part.length === 0)) {
    throw new Error("Invalid hostname");
  }

  // Resolve through the system DNS and reject private addresses
  const addresses = await dns.lookup(hostname, {
    all: true,
    verbatim: true
  });

  if (
    addresses.length === 0 ||
    addresses.some(({ address, family }) => isPrivateAddress(address, family))
  ) {
    throw new Error("Hostname resolves to a private or invalid address");
  }

  return {
    url: urlObj,
    address: addresses[0].address,
    family: addresses[0].family === 6 ? 6 : 4
  };
}

export async function checkSafeUrl(url: string) {
  try {
    await resolveSafeUrl(url);
    return true;
  } catch (error) {
    return false;
  }
}
