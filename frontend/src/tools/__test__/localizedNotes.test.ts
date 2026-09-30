import { describe, expect, it } from "vitest";
import { pickLocalizedNotes } from "../localizedNotes";

describe("pickLocalizedNotes", () => {
  it("returns a plain string as-is (language-neutral fallback)", () => {
    expect(pickLocalizedNotes("plain text", "zh_cn")).toBe("plain text");
    expect(pickLocalizedNotes("plain text")).toBe("plain text");
  });

  it("returns undefined for empty notes", () => {
    expect(pickLocalizedNotes(undefined)).toBeUndefined();
    expect(pickLocalizedNotes(null)).toBeUndefined();
    expect(pickLocalizedNotes({}, "zh_cn")).toBeUndefined();
  });

  it("picks the exact locale", () => {
    const notes = { en_us: "english", zh_cn: "chinese", ja_jp: "japanese" };
    expect(pickLocalizedNotes(notes, "zh_cn")).toBe("chinese");
    expect(pickLocalizedNotes(notes, "ja_jp")).toBe("japanese");
    expect(pickLocalizedNotes(notes, "en_us")).toBe("english");
  });

  it("matches locale keys case- and hyphen-insensitively", () => {
    const notes = { "zh-CN": "chinese", "EN_US": "english" };
    expect(pickLocalizedNotes(notes, "zh_cn")).toBe("chinese");
    expect(pickLocalizedNotes(notes, "en_us")).toBe("english");
  });

  it("falls back to the base language when the region is missing", () => {
    const notes = { zh: "chinese", en_us: "english" };
    expect(pickLocalizedNotes(notes, "zh_tw")).toBe("chinese");
    expect(pickLocalizedNotes(notes, "zh_cn")).toBe("chinese");
  });

  it("falls back to English when the panel language is missing", () => {
    const notes = { en_us: "english", ja_jp: "japanese" };
    expect(pickLocalizedNotes(notes, "zh_cn")).toBe("english");
    expect(pickLocalizedNotes(notes, "de_de")).toBe("english");
  });

  it("falls back to en when en_us is missing", () => {
    const notes = { en: "english", ja_jp: "japanese" };
    expect(pickLocalizedNotes(notes, "zh_cn")).toBe("english");
    expect(pickLocalizedNotes(notes, "en_gb")).toBe("english");
  });

  it("returns undefined when nothing matches (including no English)", () => {
    expect(pickLocalizedNotes({ ja_jp: "japanese" }, "zh_cn")).toBeUndefined();
    expect(pickLocalizedNotes({ ja_jp: "japanese" })).toBeUndefined();
  });

  it("skips empty values and falls through", () => {
    const notes = { zh_cn: "", en_us: "english" };
    expect(pickLocalizedNotes(notes, "zh_cn")).toBe("english");
  });
});
