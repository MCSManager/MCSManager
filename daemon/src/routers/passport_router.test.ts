import { beforeEach, describe, expect, it, vi } from "vitest";

import { globalConfiguration } from "../entity/config";
import { dispatch, packetsFor, flush } from "../../test/harness/router";
import { mockMissionPassport } from "../../test/harness/mocks";

vi.mock("../service/mission_passport", () => mockMissionPassport());
vi.mock("../service/log", () => {
  const f = () => {};
  f.info = f;
  f.warn = f;
  f.error = f;
  return { default: f };
});

// Register gate + passport handlers.
import "./auth_router";
import "./passport_router";
import { missionPassport } from "../service/mission_passport";

beforeEach(() => {
  globalConfiguration.config.key = "test-key";
  vi.mocked(missionPassport.registerMission).mockClear();
  vi.mocked(missionPassport.getMission).mockClear();
});

const AUTHED = (id = "s1") => ({ key: "test-key", login: true, id, type: "TOP_LEVEL", stream: {} });

describe("passport/register (authenticated)", () => {
  it("registers a mission and responds {200, true}", async () => {
    const { socket } = dispatch(
      "passport/register",
      { name: "download", password: "pw-1", parameter: { uuid: "u" }, count: 1 },
      { session: AUTHED() }
    );
    await flush();
    expect(packetsFor(socket, "passport/register")[0]).toMatchObject({ status: 200, data: true });
    expect(missionPassport.registerMission).toHaveBeenCalledWith("pw-1", expect.objectContaining({ name: "download" }));
    // The registry-backed getMission reflects the registered mission.
    vi.mocked(missionPassport.getMission).mockReturnValue({ name: "download" } as any);
    expect(missionPassport.getMission("pw-1", "download")?.name).toBe("download");
  });

  it("rejects a register without name/password -> error packet (500)", async () => {
    const { socket } = dispatch("passport/register", { password: "pw", parameter: {} }, { session: AUTHED() });
    await flush();
    const pkt = packetsFor(socket, "passport/register")[0];
    expect(pkt.status).toBe(500);
    expect(String(pkt.data).length).toBeGreaterThan(0);
    expect(missionPassport.registerMission).not.toHaveBeenCalled();
  });
});
