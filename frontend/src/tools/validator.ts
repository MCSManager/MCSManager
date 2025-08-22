import { t } from "@/lang/i18n";
import { message } from "ant-design-vue";

export function emptyValueValidator(value: string | number) {
  if (String(value).trim() === "") throw new Error(t("TXT_CODE_cb08d342"));
  return Promise.resolve();
}

export function isNumberValidator(value: any) {
  if (!value || isNaN(Number(value))) throw new Error(t("TXT_CODE_a9bcbde9"));
  return Promise.resolve();
}

export function getValidatorErrorMsg(error: any, def: string = "") {
  if (error.message) {
    return error.message;
  }
  if (error.errorFields instanceof Array) {
    return String(error.errorFields[0]?.errors[0] || "");
  }
  if (error === null || error === undefined) {
    return def;
  }
  return String(error);
}

export function reportValidatorError(error: any) {
  console.error("Function reportValidatorError():", error);
  message.error(getValidatorErrorMsg(error, t("TXT_CODE_6a365d01")));
}

export function reportErrorMsg(error: any = {}) {
  console.error("Function reportErrorMsg():", error);
  message.error(getValidatorErrorMsg(error, t("TXT_CODE_6a365d01")));
}

export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[\x00-\x7F]{9,36}$/;

export function isLocalNetworkIP(ip: string): boolean {
  // Return false if empty string or invalid format
  if (!ip || typeof ip !== "string") {
    return false;
  }

  // Trim leading and trailing whitespace
  ip = ip.trim();

  // IPv4 address format check
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Regex.test(ip)) {
    const parts = ip.split(".").map(Number);

    // Check if valid IPv4 address (each part should be in 0-255 range)
    if (parts.some((part) => part < 0 || part > 255)) {
      return false;
    }

    const [first, second, third, fourth] = parts;

    // Private network address ranges
    // 10.0.0.0/8 (Class A)
    if (first === 10) {
      return true;
    }

    // 172.16.0.0/12 (Class B)
    if (first === 172 && second >= 16 && second <= 31) {
      return true;
    }

    // 192.168.0.0/16 (Class C)
    if (first === 192 && second === 168) {
      return true;
    }

    // Loopback address 127.0.0.0/8
    if (first === 127) {
      return true;
    }

    // Link-local address 169.254.0.0/16
    if (first === 169 && second === 254) {
      return true;
    }

    // Multicast address 224.0.0.0/4
    if (first >= 224 && first <= 239) {
      return true;
    }

    // Reserved addresses
    // 0.0.0.0/8 (current network)
    if (first === 0) {
      return true;
    }

    // 255.255.255.255 (broadcast address)
    if (first === 255 && second === 255 && third === 255 && fourth === 255) {
      return true;
    }
  }

  // IPv6 address check
  if (ip.includes(":")) {
    // Local loopback address
    if (ip === "::1") {
      return true;
    }

    // Link-local address fe80::/10
    if (
      ip.toLowerCase().startsWith("fe80:") ||
      ip.toLowerCase().startsWith("fe8") ||
      ip.toLowerCase().startsWith("fe9") ||
      ip.toLowerCase().startsWith("fea") ||
      ip.toLowerCase().startsWith("feb")
    ) {
      return true;
    }

    // Unique local address fc00::/7
    if (ip.toLowerCase().startsWith("fc") || ip.toLowerCase().startsWith("fd")) {
      return true;
    }

    // Site-local address fec0::/10 (deprecated but still need to check)
    if (
      ip.toLowerCase().startsWith("fec") ||
      ip.toLowerCase().startsWith("fed") ||
      ip.toLowerCase().startsWith("fee") ||
      ip.toLowerCase().startsWith("fef")
    ) {
      return true;
    }

    // Multicast address ff00::/8
    if (ip.toLowerCase().startsWith("ff")) {
      return true;
    }

    // Unspecified address
    if (ip === "::" || ip === "0:0:0:0:0:0:0:0") {
      return true;
    }
  }

  return false;
}
