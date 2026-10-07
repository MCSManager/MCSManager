import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import logger from "../log";
import { printStartupBanner } from "../startup_banner";

// Recording logger: the banner's contract is which channel carries which
// line — the key must never reach the logger (it persists to logs/current.log).
vi.mock("../log", () => {
  const f: any = vi.fn();
  f.info = vi.fn();
  f.debug = vi.fn();
  f.warn = vi.fn();
  f.error = vi.fn();
  return { default: f };
});

const KEY = "0123456789abcdef0123456789abcdef";

function allLoggedLines() {
  return [
    ...vi.mocked(logger.info).mock.calls,
    ...vi.mocked(logger.debug).mock.calls,
    ...vi.mocked(logger.warn).mock.calls,
    ...vi.mocked(logger.error).mock.calls
  ]
    .flat()
    .map(String);
}

let consoleSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  vi.mocked(logger.info).mockClear();
  vi.mocked(logger.debug).mockClear();
  vi.mocked(logger.warn).mockClear();
  vi.mocked(logger.error).mockClear();
  consoleSpy.mockRestore();
});

describe("printStartupBanner", () => {
  it("prints the access key to the console only, never through the logger", () => {
    printStartupBanner({ port: 24444, ssl: false, key: KEY });

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining(KEY));
    expect(allLoggedLines().some((line) => line.includes(KEY))).toBe(false);
  });

  it("routes the non-secret banner lines through the logger", () => {
    printStartupBanner({ port: 24444, ssl: false, key: KEY });

    expect(logger.info).toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining("24444"));
  });
});
