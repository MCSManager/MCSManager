import { describe, expect, it } from "vitest";
import InstanceConfig from "../entity/instance/Instance_config";
import type { DockerFileIdentity } from "./docker_file_ownership";
import { validateRootlessResourceLimits } from "./rootless_resource_limits";

const rootless: DockerFileIdentity = {
  rootless: true,
  resourceLimits: { cpu: true, memory: true }
};
const config = () => new InstanceConfig().docker;

describe("Rootless resource-limit preflight", () => {
  it("allows verified CPU/memory limits and unchanged defaults", () => {
    const docker = config();
    expect(() => validateRootlessResourceLimits(rootless, docker)).not.toThrow();
    docker.memory = 256;
    docker.cpuUsage = 50;
    expect(() => validateRootlessResourceLimits(rootless, docker)).not.toThrow();
  });

  it("accepts null defaults produced by partial instance updates, but not explicit zero flags", () => {
    const docker = {
      ...config(),
      memorySwap: null,
      memorySwappiness: null
    } as unknown as InstanceConfig["docker"];
    expect(() => validateRootlessResourceLimits(rootless, docker)).not.toThrow();
  });

  it.each([
    { cpusetCpus: "0" },
    { deviceReadBps: ["/dev/sda:1M"] },
    { deviceWriteBps: ["/dev/sda:1M"] },
    { memorySwap: 0 },
    { memorySwap: 256 },
    { memorySwappiness: 0 },
    { memorySwappiness: 10 }
  ])("rejects unverified flags %j, including explicit zero", (patch) => {
    const docker = { ...config(), ...patch };
    expect(() => validateRootlessResourceLimits(rootless, docker)).toThrow();
    expect(() => validateRootlessResourceLimits({ rootless: false }, docker)).not.toThrow();
  });

  it.each([NaN, Infinity, -1])("rejects invalid limits %s", (value) => {
    expect(() =>
      validateRootlessResourceLimits(rootless, { ...config(), memory: value })
    ).toThrow();
    expect(() =>
      validateRootlessResourceLimits(rootless, { ...config(), cpuUsage: value })
    ).toThrow();
  });

  it("rejects absent enforcement capability instead of silently dropping the limit", () => {
    expect(() =>
      validateRootlessResourceLimits({ rootless: true }, { ...config(), memory: 256 })
    ).toThrow();
    expect(() =>
      validateRootlessResourceLimits({ rootless: true }, { ...config(), cpuUsage: 50 })
    ).toThrow();
  });
});
