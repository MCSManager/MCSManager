import { describe, expect, it } from "vitest";
import { mapDaemonAddress, resolveForwardTarget, type ForwardLocation } from "./protocol";

const HTTP_LOCATION: ForwardLocation = {
  host: "panel.example.com",
  pathname: "/",
  protocol: "http:"
};

const MAPPED_DEPLOYMENT = {
  from: { addr: "panel.example.com:80", prefix: "/" },
  to: { addr: "internal.example.com:24444", prefix: "" }
};

describe("mapDaemonAddress", () => {
  it("returns undefined when no mapping matches the current location", () => {
    const mapped = mapDaemonAddress([], HTTP_LOCATION);
    expect(mapped).toBeUndefined();
  });

  it("matches the current host (appending the default http port) and returns the target", () => {
    const mapped = mapDaemonAddress([MAPPED_DEPLOYMENT], HTTP_LOCATION);
    expect(mapped).toEqual({ addr: "internal.example.com:24444", prefix: "" });
  });

  it("matches on host that already contains a port", () => {
    const mapped = mapDaemonAddress(
      [{ from: { addr: "panel.example.com:8080", prefix: "/" }, to: MAPPED_DEPLOYMENT.to }],
      { ...HTTP_LOCATION, host: "panel.example.com:8080" }
    );
    expect(mapped).toEqual({ addr: "internal.example.com:24444", prefix: "" });
  });
});

describe("resolveForwardTarget", () => {
  it("returns the daemon address when proxy mode is disabled", () => {
    const target = resolveForwardTarget(
      {
        addr: "192.168.1.10:24444",
        prefix: "",
        remoteMappings: []
      },
      HTTP_LOCATION
    );
    expect(target).toEqual({ addr: "192.168.1.10:24444", prefix: "" });
  });

  it("applies a remote mapping when it matches the current location", () => {
    const target = resolveForwardTarget(
      {
        addr: "192.168.1.10:24444",
        prefix: "",
        remoteMappings: [MAPPED_DEPLOYMENT]
      },
      HTTP_LOCATION
    );
    expect(target).toEqual({ addr: "internal.example.com:24444", prefix: "" });
  });

  it("targets the panel when proxy mode is enabled", () => {
    const target = resolveForwardTarget(
      {
        addr: "192.168.1.10:24444",
        prefix: "",
        remoteMappings: [MAPPED_DEPLOYMENT],
        proxy: true,
        panelPrefix: "/mcsm"
      },
      HTTP_LOCATION
    );
    expect(target).toEqual({ addr: "panel.example.com", prefix: "/mcsm" });
  });

  it("falls back to the daemon address when no mapping matches", () => {
    const target = resolveForwardTarget(
      {
        addr: "192.168.1.10:24444",
        prefix: "/node",
        remoteMappings: [MAPPED_DEPLOYMENT]
      },
      { host: "other.example.com", pathname: "/", protocol: "https:" }
    );
    expect(target).toEqual({ addr: "192.168.1.10:24444", prefix: "/node" });
  });
});