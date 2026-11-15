// @vitest-environment jsdom
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { defineComponent, nextTick } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAppConfigStore } from "../useAppConfigStore";
import { AppTheme } from "@/types/const";

const mocks = vi.hoisted(() => ({ getSettingsConfig: vi.fn() }));

vi.mock("@/stores/useLayoutConfig", () => ({
  useLayoutConfigStore: () => ({ getSettingsConfig: mocks.getSettingsConfig })
}));
vi.mock("@/lang/i18n", () => ({ getCurrentLang: () => "en_us", setLanguage: vi.fn() }));
vi.mock("@/types/const", () => ({
  AppTheme: { AUTO: 0, LIGHT: 1, DARK: 2 },
  THEME_KEY: "THEME_KEY"
}));
vi.mock("@vueuse/core", async () => {
  const actual = await vi.importActual<typeof import("@vueuse/core")>("@vueuse/core");
  return { ...actual, createGlobalState: (factory: () => unknown) => factory };
});

let wrapper: VueWrapper;
let store: ReturnType<typeof useAppConfigStore>;
let width: number;
let preferredDark: boolean;
const queries = new Set<MediaQueryList>();

const matches = (query: string) => {
  if (query.includes("prefers-color-scheme")) return preferredDark;
  const limit = Number(query.match(/(\d+(?:\.\d+)?)px/)?.[1]);
  return query.includes("max-width") ? width <= limit : width >= limit;
};

const resize = async (nextWidth: number) => {
  width = nextWidth;
  for (const query of queries) {
    const event = new Event("change");
    Object.defineProperty(event, "matches", { value: query.matches });
    query.dispatchEvent(event);
  }
  await nextTick();
};

const start = async (theme: Record<string, unknown> = {}) => {
  mocks.getSettingsConfig.mockResolvedValue({ theme });
  wrapper = mount(
    defineComponent({
      setup() {
        store = useAppConfigStore();
        return () => null;
      }
    })
  );
  await store.initAppTheme();
  await flushPromises();
};

beforeEach(() => {
  width = 993;
  preferredDark = false;
  queries.clear();
  localStorage.clear();
  document.body.removeAttribute("style");
  document.body.className = "";
  vi.stubGlobal("matchMedia", (query: string) => {
    const target = new EventTarget();
    const mediaQuery = Object.assign(target, {
      media: query,
      onchange: null,
      get matches() {
        return matches(query);
      },
      addListener: vi.fn(),
      removeListener: vi.fn()
    });
    Object.defineProperty(mediaQuery, "matches", { get: () => matches(query) });
    queries.add(mediaQuery as MediaQueryList);
    return mediaQuery;
  });
});

afterEach(() => {
  wrapper?.unmount();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("responsive panel backgrounds", () => {
  it("switches at 992/993px without fetching configuration again", async () => {
    const image = vi.spyOn(document.body.style, "backgroundImage", "set");
    await start({ backgroundImage: "desktop.png", pBgUrl: "phone.png" });
    expect(image).toHaveBeenLastCalledWith(expect.stringContaining("desktop.png"));
    const reads = mocks.getSettingsConfig.mock.calls.length;
    await resize(992);
    expect(image).toHaveBeenLastCalledWith(expect.stringContaining("phone.png"));
    await resize(993);
    expect(image).toHaveBeenLastCalledWith(expect.stringContaining("desktop.png"));
    expect(mocks.getSettingsConfig).toHaveBeenCalledTimes(reads);
  });

  it("uses the phone background on initial phone loading", async () => {
    width = 390;
    const image = vi.spyOn(document.body.style, "backgroundImage", "set");
    await start({ backgroundImage: "desktop.png", pBgUrl: "phone.png" });
    expect(image).toHaveBeenLastCalledWith(expect.stringContaining("phone.png"));
    expect(store.hasBgImage.value).toBe(true);
  });

  it.each([undefined, ""])("falls back to desktop when phone URL is %s", async (pBgUrl) => {
    width = 390;
    const image = vi.spyOn(document.body.style, "backgroundImage", "set");
    await start({ backgroundImage: "desktop.png", pBgUrl });
    expect(image).toHaveBeenLastCalledWith(expect.stringContaining("desktop.png"));
  });

  it("cleans background styles and transparency when leaving a phone-only image", async () => {
    width = 390;
    await start({ backgroundImage: "", pBgUrl: "phone.png" });
    expect(store.hasBgImage.value).toBe(true);
    expect(document.body.classList.contains("app-light-extend-theme")).toBe(true);
    await resize(993);
    expect(document.body.style.backgroundImage).toBe("");
    expect(store.hasBgImage.value).toBe(false);
    expect(document.body.style.backgroundSize).toBe("");
    expect(document.body.style.backgroundPosition).toBe("");
    expect(document.body.style.backgroundRepeat).toBe("");
    expect(document.body.className).not.toContain("extend-theme");
  });

  it("keeps preview sources independent across resizing and theme changes", async () => {
    const image = vi.spyOn(document.body.style, "backgroundImage", "set");
    await start({ backgroundImage: "desktop.png", pBgUrl: "phone.png" });
    store.setBackgroundImage("preview-phone.png", "pBgUrl");
    await nextTick();
    expect(image).toHaveBeenLastCalledWith(expect.stringContaining("desktop.png"));
    await resize(390);
    expect(image).toHaveBeenLastCalledWith(expect.stringContaining("preview-phone.png"));
    store.setTheme(AppTheme.DARK);
    await flushPromises();
    expect(image).toHaveBeenLastCalledWith(expect.stringContaining("preview-phone.png"));
    expect(image).toHaveBeenLastCalledWith(expect.stringContaining("rgba(0,0,0,0.65)"));
    expect(document.body.classList.contains("app-dark-extend-theme")).toBe(true);
    expect(document.body.classList.contains("app-light-extend-theme")).toBe(false);
    store.setTheme(AppTheme.LIGHT);
    await flushPromises();
    expect(document.body.classList.contains("app-light-extend-theme")).toBe(true);
    await resize(993);
    store.setBackgroundImage("preview-desktop.png");
    await nextTick();
    expect(image).toHaveBeenLastCalledWith(expect.stringContaining("preview-desktop.png"));
    await resize(390);
    expect(image).toHaveBeenLastCalledWith(expect.stringContaining("preview-phone.png"));
  });

  it("updates the automatic theme overlay without replacing a preview", async () => {
    width = 390;
    const image = vi.spyOn(document.body.style, "backgroundImage", "set");
    await start({ backgroundImage: "desktop.png", pBgUrl: "phone.png" });
    store.setTheme(AppTheme.AUTO);
    await flushPromises();
    store.setBackgroundImage("preview-phone.png", "pBgUrl");
    await nextTick();
    preferredDark = true;
    await resize(390);
    await flushPromises();
    expect(image).toHaveBeenLastCalledWith(expect.stringContaining("preview-phone.png"));
    expect(document.body.classList.contains("app-dark-extend-theme")).toBe(true);
  });

  it("falls back after clearing phone and clears all background state after clearing desktop", async () => {
    width = 390;
    const image = vi.spyOn(document.body.style, "backgroundImage", "set");
    await start({ backgroundImage: "desktop.png", pBgUrl: "phone.png" });
    store.setBackgroundImage("", "pBgUrl");
    await nextTick();
    expect(image).toHaveBeenLastCalledWith(expect.stringContaining("desktop.png"));
    store.setBackgroundImage("");
    await nextTick();
    expect(document.body.style.backgroundImage).toBe("");
    expect(store.hasBgImage.value).toBe(false);
  });
});
