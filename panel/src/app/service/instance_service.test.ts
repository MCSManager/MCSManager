import { describe, expect, it } from "vitest";
import { sanitizeMarketTemplate } from "./instance_service";

describe("sanitizeMarketTemplate", () => {
  function makeTemplate(images: string[]): IQuickStartTemplate {
    return {
      languages: [],
      packages: images.map((image, index) => ({
        language: "en",
        description: "",
        title: `pkg-${index}`,
        category: "",
        runtime: "",
        size: "",
        hardware: "",
        remark: "",
        author: "",
        setupInfo: {} as IGlobalInstanceConfig,
        gameType: "",
        image,
        platform: ""
      }))
    };
  }

  it("upgrades http:// package image URLs to https://", () => {
    const template = makeTemplate(["http://example.com/cover.png"]);
    const result = sanitizeMarketTemplate(template);
    expect(result.packages[0].image).toBe("https://example.com/cover.png");
  });

  it("leaves https:// package image URLs unchanged", () => {
    const template = makeTemplate(["https://example.com/cover.png"]);
    const result = sanitizeMarketTemplate(template);
    expect(result.packages[0].image).toBe("https://example.com/cover.png");
  });

  it("leaves protocol-relative and empty image URLs unchanged", () => {
    const template = makeTemplate(["//example.com/cover.png", ""]);
    const result = sanitizeMarketTemplate(template);
    expect(result.packages[0].image).toBe("//example.com/cover.png");
    expect(result.packages[1].image).toBe("");
  });

  it("handles a mix of http and https across multiple packages", () => {
    const template = makeTemplate([
      "http://a.example.com/1.png",
      "https://b.example.com/2.png",
      "http://c.example.com/3.png"
    ]);
    const result = sanitizeMarketTemplate(template);
    expect(result.packages.map((p) => p.image)).toEqual([
      "https://a.example.com/1.png",
      "https://b.example.com/2.png",
      "https://c.example.com/3.png"
    ]);
  });

  it("tolerates a template with no packages field", () => {
    const template = { languages: [] } as unknown as IQuickStartTemplate;
    expect(() => sanitizeMarketTemplate(template)).not.toThrow();
  });
});
