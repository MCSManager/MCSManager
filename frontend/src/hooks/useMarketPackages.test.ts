// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { matchesLanguage, resetSearchForm, type SearchForm } from "./useMarketPackages";

describe("matchesLanguage", () => {
  it("keeps every language when the filter is reset", () => {
    expect(matchesLanguage({ language: "zh_cn" }, "ALL")).toBe(true);
    expect(matchesLanguage({ language: "en_us" }, "ALL")).toBe(true);
  });

  it("keeps the selected language and English fallback", () => {
    expect(matchesLanguage({ language: "zh_cn" }, "zh_cn")).toBe(true);
    expect(matchesLanguage({ language: "en_us" }, "zh_cn")).toBe(true);
    expect(matchesLanguage({ language: "ja_jp" }, "zh_cn")).toBe(false);
  });
});

describe("resetSearchForm", () => {
  it("clears every market filter", () => {
    const form: SearchForm = {
      language: "zh_cn",
      category: "survival",
      gameType: "minecraft",
      platform: "Windows",
      keyword: "paper",
      isSupportDocker: true,
      system: "win"
    };

    resetSearchForm(form);

    expect(form).toMatchObject({
      language: "ALL",
      category: "ALL",
      gameType: "ALL",
      platform: "ALL",
      keyword: ""
    });
  });
});
