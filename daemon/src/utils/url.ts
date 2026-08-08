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

export async function checkSafeUrl(url: string) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    // Reject ip addresses
    if ((hostname.startsWith("[") && hostname.endsWith("]")) || isIP(hostname) !== 0) {
      return false;
    }

    // Reject local domains
    if (
      hostname === "localhost" ||
      hostname.endsWith(".localhost") ||
      hostname.endsWith(".local")
    ) {
      return false;
    }

    // Must contain at least one dot (ensure it's a valid domain, not a single word)
    if (!hostname.includes(".")) {
      return false;
    }

    // Domain must have at least a top-level domain (exclude single dot cases)
    const parts = hostname.split(".");
    if (parts.length < 2 || parts.some((part) => part.length === 0)) {
      return false;
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
      return false;
    }

    // Only allow HTTP and HTTPS protocols
    if (urlObj.protocol !== "http:" && urlObj.protocol !== "https:") {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}
