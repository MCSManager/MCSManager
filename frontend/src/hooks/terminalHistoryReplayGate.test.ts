import { describe, expect, it } from "vitest";
import { createTerminalHistoryReplayGate } from "./terminalHistoryReplayGate";

describe("createTerminalHistoryReplayGate", () => {
  it("starts not replaying", () => {
    const gate = createTerminalHistoryReplayGate();
    expect(gate.isReplaying()).toBe(false);
  });

  it("reports replaying once begin() is called", () => {
    const gate = createTerminalHistoryReplayGate();
    gate.begin();
    expect(gate.isReplaying()).toBe(true);
  });

  it("reports not replaying once end() is called", () => {
    const gate = createTerminalHistoryReplayGate();
    gate.begin();
    gate.end();
    expect(gate.isReplaying()).toBe(false);
  });

  it("supports multiple begin/end cycles independently", () => {
    const gate = createTerminalHistoryReplayGate();
    gate.begin();
    gate.end();
    gate.begin();
    expect(gate.isReplaying()).toBe(true);
    gate.end();
    expect(gate.isReplaying()).toBe(false);
  });
});
