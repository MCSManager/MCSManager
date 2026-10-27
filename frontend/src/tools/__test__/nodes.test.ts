// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import type { NodeStatus } from "@/types/index";
import { resolveStoredRemoteNode } from "../nodes";

const nodeA: NodeStatus = {
  available: true,
  ip: "10.0.0.1",
  port: 24444,
  remarks: "A",
  uuid: "node-a"
};

const nodeB: NodeStatus = {
  available: false,
  ip: "10.0.0.2",
  port: 24444,
  remarks: "B",
  uuid: "node-b"
};

const globalNode: NodeStatus = {
  available: true,
  ip: "",
  port: 0,
  remarks: "",
  uuid: "global"
};

describe("resolveStoredRemoteNode", () => {
  it("returns undefined when no nodes are available", () => {
    expect(resolveStoredRemoteNode('{"uuid":"node-a"}', [])).toBeUndefined();
  });

  it("falls back to the first node when nothing is stored", () => {
    expect(resolveStoredRemoteNode(null, [nodeA, nodeB])).toBe(nodeA);
  });

  it("falls back to the first node when the stored JSON is invalid", () => {
    expect(resolveStoredRemoteNode("not-json", [nodeA, nodeB])).toBe(nodeA);
  });

  it("falls back to the first node when the stored node no longer exists", () => {
    expect(resolveStoredRemoteNode('{"uuid":"removed-node"}', [nodeA, nodeB])).toBe(nodeA);
  });

  it("returns the fresh node from the current list instead of the stored copy", () => {
    const stored = JSON.stringify({ ...nodeB, available: true, ip: "10.9.9.9" });

    expect(resolveStoredRemoteNode(stored, [nodeA, nodeB])).toBe(nodeB);
  });

  it("keeps the global mode when its uuid is stored and a global node is provided", () => {
    expect(resolveStoredRemoteNode('{"uuid":"global"}', [nodeA, nodeB], globalNode)).toBe(
      globalNode
    );
  });

  it("falls back to the first node for a stored global uuid when global mode is unsupported", () => {
    expect(resolveStoredRemoteNode('{"uuid":"global"}', [nodeA, nodeB])).toBe(nodeA);
  });
});
