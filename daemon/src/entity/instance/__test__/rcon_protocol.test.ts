import { describe, expect, it } from "vitest";
import Instance from "../instance";
import InstanceConfig from "../Instance_config";

const webTarget = { rconIp: "127.0.0.1", rconPort: 28016, rconPassword: "test-only" };

describe("instance RCON protocol configuration", () => {
  it("defaults old instances to Source RCON", () => {
    const config = new InstanceConfig();
    expect(config.rconProtocol).toBe("source");
  });

  it("accepts a protocol change while stopped", () => {
    const instance = new Instance("rcon-test", new InstanceConfig());
    instance.parameters({ rconProtocol: "rust-web", ...webTarget }, false);
    expect(instance.config.rconProtocol).toBe("rust-web");
  });

  it("rejects invalid protocols without changing the instance", () => {
    const instance = new Instance("rcon-test", new InstanceConfig());
    expect(() => instance.parameters({ rconProtocol: "arbitrary" }, false)).toThrow();
    expect(instance.config.rconProtocol).toBe("source");
  });

  it("does not switch protocols on a running instance", () => {
    const instance = new Instance("rcon-test", new InstanceConfig());
    instance.status(Instance.STATUS_RUNNING);
    expect(() => instance.parameters({ rconProtocol: "rust-web", ...webTarget }, false)).toThrow();
    expect(instance.config.rconProtocol).toBe("source");
  });

  it("requires a complete explicit target even when Source already has one", () => {
    const instance = new Instance("rcon-test", new InstanceConfig());
    instance.parameters(webTarget, false);
    for (const field of ["rconIp", "rconPort", "rconPassword"] as const) {
      const patch: Record<string, unknown> = { rconProtocol: "rust-web", ...webTarget };
      delete patch[field];
      expect(() => instance.parameters(patch, false)).toThrow();
      expect(instance.config.rconProtocol).toBe("source");
    }
  });

  it.each([
    { rconIp: "http://127.0.0.1" },
    { rconIp: "server/path" },
    { rconIp: "999.999.999.999" },
    { rconIp: "a".repeat(254) },
    { rconIp: "" },
    { rconIp: {} },
    { rconPort: 0 },
    { rconPort: 65536 },
    { rconPort: 1.5 },
    { rconPort: "28016" },
    { rconPort: NaN },
    { rconPassword: "" },
    { rconPassword: false },
    { rconPassword: "secret\ud800" }
  ])("rejects invalid targets before changing any settings %#", (patch) => {
    const instance = new Instance("rcon-test", new InstanceConfig());
    const original = JSON.parse(JSON.stringify(instance.config));
    expect(() =>
      instance.parameters(
        { nickname: "must not change", rconProtocol: "rust-web", ...webTarget, ...patch },
        false
      )
    ).toThrow();
    expect(instance.config).toEqual(original);

    instance.parameters({ rconProtocol: "rust-web", ...webTarget }, false);
    const webConfig = JSON.parse(JSON.stringify(instance.config));
    expect(() => instance.parameters({ nickname: "must not change", ...patch }, false)).toThrow();
    expect(instance.config).toEqual(webConfig);
  });

  it("accepts valid partial changes to an existing WebRCON target", () => {
    const instance = new Instance("rcon-test", new InstanceConfig());
    instance.parameters({ rconProtocol: "rust-web", ...webTarget }, false);
    instance.parameters({ rconPort: 65535 }, false);
    instance.parameters({ rconIp: "[::1]" }, false);
    instance.parameters({ rconPassword: "p/a#b" }, false);
    instance.parameters({ enableRcon: true }, false);
    expect(instance.config).toMatchObject({
      rconProtocol: "rust-web",
      rconPort: 65535,
      rconIp: "[::1]",
      rconPassword: "p/a#b",
      enableRcon: true
    });
  });

  it("allows unrelated edits and disabling, but not enabling an invalid legacy target", () => {
    const config = new InstanceConfig();
    config.rconProtocol = "rust-web";
    config.rconPort = 0;
    config.enableRcon = true;
    const instance = new Instance("rcon-test", config);
    instance.parameters({ nickname: "legacy web" }, false);
    instance.parameters({ enableRcon: false }, false);
    expect(instance.config.enableRcon).toBe(false);
    for (const patch of [
      { enableRcon: true },
      { enableRcon: "true" },
      { rconProtocol: "rust-web" }
    ]) {
      expect(() => instance.parameters(patch, false)).toThrow();
      expect(instance.config.enableRcon).toBe(false);
    }
    instance.parameters(webTarget, false);
    instance.parameters({ enableRcon: true }, false);
    expect(instance.config.enableRcon).toBe(true);
  });

  it("preserves Source RCON configuration behavior", () => {
    const instance = new Instance("rcon-test", new InstanceConfig());
    instance.parameters({ rconIp: "", rconPort: 0, rconPassword: "" }, false);
    expect(instance.config).toMatchObject({
      rconProtocol: "source",
      rconPort: 0,
      rconPassword: ""
    });
  });
});
