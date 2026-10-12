import { EventEmitter } from "node:events";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type Instance from "../entity/instance/instance";

vi.mock("child_process", () => ({ spawn: vi.fn() }));
vi.mock("./log", () => ({ default: { info: vi.fn(), error: vi.fn() } }));
vi.mock("./docker_file_ownership", () => ({ dockerFileOwnership: { resolve: vi.fn() } }));
vi.mock("./docker_process_service", () => ({
  SetupDockerContainer: vi.fn(() => ({
    start: vi.fn(async () => {}),
    attach: vi.fn(async () => {}),
    wait: vi.fn(async () => {}),
    stop: vi.fn(async () => {})
  }))
}));

import { spawn } from "child_process";
import { dockerFileOwnership } from "./docker_file_ownership";
import { SetupDockerContainer } from "./docker_process_service";
import { InstanceUpdateAction } from "./instance_update_action";

beforeEach(() => {
  vi.clearAllMocks();
  const child = Object.assign(new EventEmitter(), {
    pid: 123,
    stdout: new EventEmitter(),
    stderr: new EventEmitter()
  });
  vi.mocked(spawn).mockReturnValue(child as ReturnType<typeof spawn>);
});

function instance(processType = "docker", updateCommandImage = "HOST") {
  return {
    instanceUuid: "test-instance",
    config: {
      processType,
      runAs: "1000:1000",
      updateCommand: "node update.js",
      oe: "utf-8",
      docker: { image: "game-image", updateCommandImage }
    },
    parseTextParams: vi.fn(async (text: string) => text),
    absoluteCwdPath: () => "/test-workspace",
    print: vi.fn(),
    println: vi.fn()
  } as unknown as Instance;
}

describe("Rootless update isolation", () => {
  it("rejects HOST updates before spawning an instance command", async () => {
    vi.mocked(dockerFileOwnership.resolve).mockResolvedValue({ rootless: true });
    await expect(new InstanceUpdateAction(instance()).onStart()).rejects.toThrow();
    expect(spawn).not.toHaveBeenCalled();
    expect(SetupDockerContainer).not.toHaveBeenCalled();
  });

  it("does not fall back to HOST when engine verification fails", async () => {
    vi.mocked(dockerFileOwnership.resolve).mockRejectedValue(new Error("unverified engine"));
    await expect(new InstanceUpdateAction(instance()).onStart()).rejects.toThrow(
      "unverified engine"
    );
    expect(spawn).not.toHaveBeenCalled();
  });

  it("preserves Rootful HOST updates", async () => {
    vi.mocked(dockerFileOwnership.resolve).mockResolvedValue({ rootless: false });
    await new InstanceUpdateAction(instance()).onStart();
    expect(spawn).toHaveBeenCalledWith("node", ["update.js"], {
      cwd: "/test-workspace",
      stdio: "pipe",
      windowsHide: true
    });
  });

  it("preserves ordinary process updates without querying Docker", async () => {
    await new InstanceUpdateAction(instance("general")).onStart();
    expect(spawn).toHaveBeenCalledOnce();
    expect(dockerFileOwnership.resolve).not.toHaveBeenCalled();
  });

  it("delegates container updates to the normal Docker setup path", async () => {
    const target = instance("docker", "update-image");
    await new InstanceUpdateAction(target).onStart();
    expect(SetupDockerContainer).toHaveBeenCalledWith(target, "node update.js", "update-image");
    expect(spawn).not.toHaveBeenCalled();
  });
});
