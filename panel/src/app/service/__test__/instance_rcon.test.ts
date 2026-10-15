import { beforeEach, describe, expect, it, vi } from "vitest";
import { updateInstanceWithRconAuthorization } from "../instance_rcon";

const mocks = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock("../remote_command", () => ({
  default: class {
    request = mocks.request;
  }
}));
vi.mock("../../i18n", () => ({ $t: (key: string) => key }));

beforeEach(() => {
  mocks.request.mockReset();
  mocks.request.mockResolvedValue({ instanceUuid: "test" });
});

describe("panel RCON authorization", () => {
  it("rejects user-selected WebRCON before sending an RPC", () => {
    expect(() =>
      updateInstanceWithRconAuthorization(undefined, "test", {
        rconProtocol: "rust-web",
        allowWebRconConfiguration: true
      })
    ).toThrow("TXT_CODE_RCON_WEB_adminOnly");
    expect(mocks.request).not.toHaveBeenCalled();
  });

  it("sends all RCON patches through the new RPC without inheriting a body capability", async () => {
    const config = { rconPort: 80, allowWebRconConfiguration: true };
    await updateInstanceWithRconAuthorization(undefined, "test", config, false);
    expect(mocks.request).toHaveBeenCalledWith("instance/update_rcon", {
      instanceUuid: "test",
      config,
      allowWebRconConfiguration: false
    });
  });

  it("permits admin WebRCON updates using a positive capability", async () => {
    const config = { rconProtocol: "rust-web", rconIp: "localhost", rconPort: 28016 };
    await updateInstanceWithRconAuthorization(undefined, "test", config, true);
    expect(mocks.request).toHaveBeenCalledWith("instance/update_rcon", {
      instanceUuid: "test",
      config,
      allowWebRconConfiguration: true
    });
  });

  it("does not fall back when an old daemon rejects the new RPC", async () => {
    mocks.request.mockRejectedValue(new Error("unsupported RPC"));
    await expect(
      updateInstanceWithRconAuthorization(undefined, "test", { rconPort: 80 })
    ).rejects.toThrow("unsupported RPC");
    expect(mocks.request).toHaveBeenCalledTimes(1);
    expect(mocks.request.mock.calls[0][0]).toBe("instance/update_rcon");
  });

  it("keeps ordinary settings compatible with older daemons", async () => {
    const config = { nickname: "server" };
    await updateInstanceWithRconAuthorization(undefined, "test", config);
    expect(mocks.request.mock.calls[0][0]).toBe("instance/update");
  });
});
