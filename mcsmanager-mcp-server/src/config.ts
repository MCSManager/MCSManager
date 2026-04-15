import type { AppConfig } from "./types.js";

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  return {
    panelBaseUrl: normalizePanelBaseUrl(requireEnv(env, "MCSM_PANEL_BASE_URL")),
    apiKey: requireEnv(env, "MCSM_API_KEY"),
    confirmationTtlMs: parsePositiveInteger(env.MCSM_CONFIRM_TTL_SECONDS, 60) * 1000,
    requestTimeoutMs: parsePositiveInteger(env.MCSM_REQUEST_TIMEOUT_MS, 5000),
    allowedInstanceCommands: parseList(env.MCSM_ALLOWED_INSTANCE_COMMANDS),
    alertEnabled: parseBoolean(env.MCSM_ALERT_ENABLED, false),
    alertPushUrl: env.MCSM_ALERT_PUSH_URL,
    alertPollIntervalMs: parsePositiveInteger(env.MCSM_ALERT_POLL_INTERVAL_SECONDS, 60) * 1000
  };
}

export function normalizePanelBaseUrl(rawValue: string): string {
  const value = rawValue.trim();
  if (!value) throw new Error("MCSM_PANEL_BASE_URL is required.");

  const url = new URL(value);
  url.search = "";
  url.hash = "";

  let pathname = url.pathname.replace(/\/+$/, "");
  if (!pathname.endsWith("/api")) pathname = `${pathname}/api`;
  url.pathname = pathname.replace(/\/+/g, "/");

  return url.toString().replace(/\/$/, "");
}

function requireEnv(env: NodeJS.ProcessEnv, key: string): string {
  const value = env[key]?.trim();
  if (!value) throw new Error(`${key} is required.`);
  return value;
}

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

function parseList(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (!value) return fallback;
  return value === "true" || value === "1" || value === "yes";
}
