import { describe, expect, it } from "vitest";
import { hasRconConfigUpdate, isWebRconConfigUpdate, type RconConfig } from "../rcon_config";

describe("RCON update classification", () => {
  it("classifies every RCON field, including invalid runtime values", () => {
    const values: Record<keyof RconConfig, unknown> = {
      rconProtocol: "invalid-protocol",
      rconIp: "",
      rconPort: "not-a-number",
      rconPassword: false,
      enableRcon: 0
    };
    for (const [key, value] of Object.entries(values)) {
      const patch = { [key]: value };
      expect(hasRconConfigUpdate(patch)).toBe(true);
      expect(isWebRconConfigUpdate("rust-web", patch)).toBe(true);
    }
  });

  it("ignores absent and null fields but treats falsy settings as updates", () => {
    expect(hasRconConfigUpdate(undefined)).toBe(false);
    expect(hasRconConfigUpdate({ rconIp: null, rconProtocol: undefined })).toBe(false);
    for (const config of [{ rconIp: "" }, { rconPort: 0 }, { enableRcon: false }])
      expect(hasRconConfigUpdate(config)).toBe(true);
  });

  it("protects entering and leaving WebRCON, including target-only changes", () => {
    expect(isWebRconConfigUpdate("source", { rconProtocol: "rust-web" })).toBe(true);
    for (const config of [{ rconProtocol: "source" }, { rconPassword: "" }, { rconPort: 80 }])
      expect(isWebRconConfigUpdate("rust-web", config)).toBe(true);
  });

  it("preserves Source updates and unrelated WebRCON metadata updates", () => {
    expect(isWebRconConfigUpdate("source", { rconPort: 28016 })).toBe(false);
    expect(isWebRconConfigUpdate("rust-web", {})).toBe(false);
    expect(isWebRconConfigUpdate("rust-web", { rconIp: null })).toBe(false);
  });
});
