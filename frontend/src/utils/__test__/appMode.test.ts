import { afterEach, describe, expect, it } from "vitest";
import { isAppMode } from "../appMode";

function stubWindow(search: string, flag?: boolean) {
  const win: Record<string, unknown> = { location: { search } };
  if (flag !== undefined) win.__MCSMANAGER_IS_APP__ = flag;
  (globalThis as any).window = win;
  return win;
}

afterEach(() => {
  delete (globalThis as any).window;
});

describe("isAppMode", () => {
  it("returns false in a plain browser", () => {
    stubWindow("");
    expect(isAppMode()).toBe(false);
  });

  it("returns false without the window object", () => {
    expect(isAppMode()).toBe(false);
  });

  it("returns true when the desktop shell marker is in the URL", () => {
    stubWindow("?__mcsmanager_app=1");
    expect(isAppMode()).toBe(true);
  });

  it("ignores other marker values", () => {
    stubWindow("?__mcsmanager_app=0");
    expect(isAppMode()).toBe(false);
  });

  it("materializes the injected marker as a window global", () => {
    const win = stubWindow("?__mcsmanager_app=1");
    isAppMode();
    expect(win.__MCSMANAGER_IS_APP__).toBe(true);
  });

  it("returns true when the window global is already set", () => {
    stubWindow("", true);
    expect(isAppMode()).toBe(true);
  });
});
