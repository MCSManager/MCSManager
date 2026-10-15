import { describe, expect, it, vi } from "vitest";
import FunctionDispatcher from "../dispatcher";
import RconCommand from "../steam/rcon_command";
import WebRconCommand from "../steam/web_rcon_command";
import GeneralSendCommand from "../general/general_command";
import type Instance from "../../instance/instance";

async function commandFor(enableRcon: boolean, rconProtocol?: "source" | "rust-web") {
  const presets = new Map<string, unknown>();
  const instance = {
    config: {
      enableRcon,
      rconProtocol,
      processType: "general",
      type: "steam/universal",
      terminalOption: { pty: false }
    },
    lifeCycleTaskManager: { clearLifeCycleTask: vi.fn(), registerLifeCycleTask: vi.fn() },
    clearPreset: vi.fn(() => presets.clear()),
    setPreset: vi.fn((name: string, command: unknown) => presets.set(name, command))
  } as unknown as Instance;
  await new FunctionDispatcher().exec(instance);
  return presets.get("command");
}

describe("RCON command dispatch", () => {
  it("uses stdin when RCON is disabled", async () => {
    expect(await commandFor(false)).toBeInstanceOf(GeneralSendCommand);
  });

  it("keeps Source RCON for existing instances without a protocol", async () => {
    expect(await commandFor(true)).toBeInstanceOf(RconCommand);
  });

  it("selects Rust WebRCON only when requested", async () => {
    expect(await commandFor(true, "rust-web")).toBeInstanceOf(WebRconCommand);
  });
});
