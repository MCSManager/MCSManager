// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { resetSearchForm, type SearchForm } from "./useMarketPackages";

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
