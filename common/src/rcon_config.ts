export interface RconConfig {
  rconProtocol?: "source" | "rust-web";
  rconIp?: string;
  rconPort?: number;
  rconPassword?: string;
  enableRcon?: boolean;
}

export type RconConfigUpdate = { [K in keyof RconConfig]?: unknown };

// New RCON fields must be classified for authorization, even if their value is invalid.
const RCON_FIELDS: Record<keyof RconConfig, true> = {
  rconProtocol: true,
  rconIp: true,
  rconPort: true,
  rconPassword: true,
  enableRcon: true
};
const RCON_KEYS = Object.keys(RCON_FIELDS) as (keyof RconConfig)[];

export function hasRconConfigUpdate(config?: RconConfigUpdate | null): boolean {
  return RCON_KEYS.some((key) => config?.[key] != null);
}

export function isWebRconConfigUpdate(
  currentProtocol: string,
  config?: RconConfigUpdate | null
): boolean {
  return (
    config?.rconProtocol === "rust-web" ||
    (currentProtocol === "rust-web" && hasRconConfigUpdate(config))
  );
}
