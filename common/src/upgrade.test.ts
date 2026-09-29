import { describe, expect, it } from "vitest";
import { compareVersions } from "./upgrade";

describe("compareVersions", () => {
  it("compares segment-wise numerically", () => {
    expect(compareVersions("4.18.4", "4.18.3")).toBe(1);
    expect(compareVersions("4.18.3", "4.18.4")).toBe(-1);
    expect(compareVersions("10.0.0", "9.9.9")).toBe(1);
    expect(compareVersions("1.2.3", "1.2.3")).toBe(0);
  });

  it("treats missing segments as 0", () => {
    expect(compareVersions("1.2", "1.2.0")).toBe(0);
    expect(compareVersions("1.2.0.1", "1.2")).toBe(1);
    expect(compareVersions(undefined, "0")).toBe(0);
  });

  it("treats non-numeric segments as 0", () => {
    expect(compareVersions("1.x.3", "1.0.3")).toBe(0);
  });
});
