import { beforeEach, describe, expect, it, vi } from "vitest";

import type { TranslateFn } from "../i18n";

vi.mock("@/services/apis", () => ({
  updateSettings: () => ({ execute: async () => ({}) })
}));

vi.mock("@/stores/useAppStateStore", () => ({
  useAppStateStore: () => ({ state: { isInstall: false } })
}));

describe("resolveWithEnglishFallback", () => {
  let resolveWithEnglishFallback: typeof import("../i18n")["resolveWithEnglishFallback"];

  beforeEach(async () => {
    (globalThis as any).window = {};
    ({ resolveWithEnglishFallback } = await import("../i18n"));
  });

  it("returns the primary translation when it is not empty", () => {
    const translate = vi.fn().mockReturnValue("你好");
    expect(resolveWithEnglishFallback(translate, ["K"])).toBe("你好");
    expect(translate).toHaveBeenCalledTimes(1);
  });

  it("falls back to English when the current locale yields an empty string", () => {
    const translate = vi.fn((...args: any[]) => (args[1] === "en_us" ? "Hello" : ""));
    expect(resolveWithEnglishFallback(translate, ["K"])).toBe("Hello");
    expect(translate).toHaveBeenNthCalledWith(2, "K", "en_us");
  });

  it("falls back to English for a missing (undefined) message", () => {
    const translate = vi.fn((...args: any[]) =>
      args[1] === "en_us" ? "Hello" : undefined
    ) as unknown as TranslateFn;
    expect(resolveWithEnglishFallback(translate, ["K"])).toBe("Hello");
  });

  it("falls back to English for a null message", () => {
    const translate = vi.fn((...args: any[]) =>
      args[1] === "en_us" ? "Hello" : null
    ) as unknown as TranslateFn;
    expect(resolveWithEnglishFallback(translate, ["K"])).toBe("Hello");
  });

  it("forwards interpolation params to the English fallback", () => {
    const params = { name: "MCS" };
    const translate = vi.fn((...args: any[]) => (args[1] === "en_us" ? "Hello MCS" : ""));
    expect(resolveWithEnglishFallback(translate, ["K", params])).toBe("Hello MCS");
    expect(translate).toHaveBeenNthCalledWith(2, "K", "en_us", params);
  });

  it("strips an explicit locale but keeps params for the English fallback", () => {
    const params = { name: "MCS" };
    const translate = vi.fn().mockReturnValue("");
    resolveWithEnglishFallback(translate, ["K", "zh_cn", params]);
    expect(translate).toHaveBeenNthCalledWith(2, "K", "en_us", params);
  });

  it("returns the primary value when English is also empty", () => {
    const translate = vi.fn().mockReturnValue("");
    expect(resolveWithEnglishFallback(translate, ["K"])).toBe("");
  });
});
