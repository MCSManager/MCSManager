import type { IBuffer } from "@xterm/xterm";
import { describe, expect, it } from "vitest";
import { snapSelectionEnd, snapSelectionStart } from "../terminalTouchSelection";

function createBuffer(widths: number[]): IBuffer {
  return {
    getLine: () => ({
      getCell: (column: number) => ({
        getWidth: () => widths[column] ?? 1
      })
    })
  } as unknown as IBuffer;
}

describe("terminal touch selection boundaries", () => {
  it("moves a start boundary to the leading cell of a wide character", () => {
    const buffer = createBuffer([1, 2, 0, 1]);
    expect(snapSelectionStart(buffer, 4, 2)).toBe(1);
  });

  it("moves an end boundary past the continuation cell of a wide character", () => {
    const buffer = createBuffer([1, 2, 0, 1]);
    expect(snapSelectionEnd(buffer, 4, 2)).toBe(3);
  });

  it("keeps ordinary and wrapped-line boundaries unchanged", () => {
    const buffer = createBuffer([1, 1, 1, 1]);
    expect(snapSelectionStart(buffer, 4, 1)).toBe(1);
    expect(snapSelectionEnd(buffer, 4, 4)).toBe(4);
  });
});
