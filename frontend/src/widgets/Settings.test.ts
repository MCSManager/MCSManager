// @vitest-environment jsdom
// Smoke tests for the "Auto Update" tab in Settings.vue:
// - the feature lives in the left tab bar (no more standalone top banner)
// - version/status/source/allow controls render and bind to settings
// - update button enable/disable logic
// - save persists updateSourceUrl / allowAutoUpdate through setSettingInfo
// - update flow: Modal.confirm -> upgradePanel() -> restart-required modal
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { Modal, message } from "ant-design-vue";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Settings from "@/widgets/Settings.vue";

const mocks = vi.hoisted(() => ({
  settingExecute: vi.fn(),
  submitExecute: vi.fn(),
  upgradeInfoExecute: vi.fn(),
  upgradePanelExecute: vi.fn(),
  getSettingsConfig: vi.fn(async () => ({ theme: {} })),
  setSettingsConfig: vi.fn(),
  reportErrorMsg: vi.fn(),
  useUploadFileDialog: vi.fn(async () => undefined)
}));

vi.mock("@/services/apis", () => ({
  settingInfo: () => ({ execute: mocks.settingExecute, isReady: true, isLoading: false }),
  setSettingInfo: () => ({ execute: mocks.submitExecute, isLoading: false }),
  getPanelUpgradeInfo: () => ({ execute: mocks.upgradeInfoExecute }),
  upgradePanel: () => ({ execute: mocks.upgradePanelExecute })
}));

vi.mock("@/stores/useLayoutConfig", () => ({
  useLayoutConfigStore: () => ({
    getSettingsConfig: mocks.getSettingsConfig,
    setSettingsConfig: mocks.setSettingsConfig
  })
}));

vi.mock("@/stores/useAppConfigStore", () => ({
  useAppConfigStore: () => ({
    setLogoImage: vi.fn(),
    setBackgroundImage: vi.fn()
  })
}));

vi.mock("@/stores/useLayoutContainerStore", () => ({
  useLayoutContainerStore: () => ({
    changeDesignMode: vi.fn(),
    containerState: { isDesignMode: false, showNewCardDialog: false, showPhoneMenu: false }
  })
}));

vi.mock("@/config/router", () => ({
  router: {
    push: vi.fn(),
    replace: vi.fn(),
    currentRoute: { value: { query: {} } }
  }
}));

vi.mock("@/lang/i18n", () => ({
  t: (key: string, params?: Record<string, unknown>) =>
    params
      ? key +
        " " +
        Object.entries(params)
          .map(([k, v]) => `{${k}}=${v}`)
          .join(" ")
      : key,
  isCN: () => true,
  getCurrentLang: () => "zh_cn",
  SUPPORTED_LANGS: [{ label: "English", value: "en_us" }]
}));

vi.mock("@/tools/validator", () => ({
  reportErrorMsg: mocks.reportErrorMsg
}));

vi.mock("@/components/fc", () => ({
  useUploadFileDialog: mocks.useUploadFileDialog
}));

vi.mock("@/components/IframeBox/config", () => ({
  getProPanelUrl: (path: string) => path
}));

vi.mock("@/components/IframeBox/index.vue", () => ({
  default: { name: "IframeBox", setup: () => () => null }
}));

const settingsData = () => ({
  language: "en_us",
  httpPort: 23333,
  presetPackAddr: "",
  httpIp: "",
  panelId: "",
  loginInfo: "",
  updateSourceUrl: "https://example.com/manifest.json"
});

const upgradeInfo = (overrides = {}) => ({
  configured: true,
  currentVersion: "10.0.0",
  onlineVersion: "10.1.0",
  updateAvailable: true,
  updateSourceUrl: "https://example.com/manifest.json",
  ...overrides
});

beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn()
    })
  });
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  (window as any).ResizeObserver = (window as any).ResizeObserver ?? ResizeObserverStub;
});

let wrapper: VueWrapper<any>;

const mountSettings = async () => {
  wrapper = mount(Settings, {
    props: { card: { id: "test", height: "600px" } as any },
    global: { mocks: { $t: (key: string) => key } }
  });
  await flushPromises();
  return wrapper;
};

const openAutoUpdateTab = async () => {
  const menuItems = wrapper.findAll(".left-menu > div");
  const target = menuItems.find((item) => item.text().includes("TXT_CODE_AUTOUPDATE_TAB_TITLE"));
  expect(target, "auto update menu entry exists").toBeTruthy();
  await target!.trigger("click");
  await flushPromises();
};

const findButton = (text: string) =>
  wrapper.findAll("button").find((btn) => btn.text().includes(text));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.settingExecute.mockResolvedValue({ value: settingsData() });
  mocks.submitExecute.mockResolvedValue({ value: {} });
  mocks.upgradeInfoExecute.mockResolvedValue({ value: upgradeInfo() });
  mocks.upgradePanelExecute.mockResolvedValue({ value: { started: false } });
});

afterEach(() => {
  wrapper?.unmount();
  vi.restoreAllMocks();
});

describe("Settings.vue auto update tab", () => {
  it("shows auto update as a left tab and no standalone top banner", async () => {
    await mountSettings();

    // menu entry rendered in the left tab bar
    const menuText = wrapper.find(".left-menu").text();
    expect(menuText).toContain("TXT_CODE_AUTOUPDATE_TAB_TITLE");

    // while another tab is active, no auto-update controls are rendered anywhere
    expect(wrapper.find('input[placeholder="TXT_CODE_AUTOUPDATE_WEB_SOURCE_PH"]').exists()).toBe(
      false
    );
    // the old top banner was an a-alert; it must be gone
    expect(wrapper.find(".ant-alert").exists()).toBe(false);
  });

  it("renders version status and source input inside the tab", async () => {
    await mountSettings();
    await openAutoUpdateTab();

    expect(wrapper.text()).toContain("TXT_CODE_AUTOUPDATE_WEB_TITLE_DESC");
    expect(wrapper.text()).toContain("v10.0.0");
    // update available -> "new version" tag with the online version
    expect(wrapper.text()).toContain("TXT_CODE_AUTOUPDATE_WEB_LATEST");
    expect(wrapper.text()).toContain("10.1.0");

    const sourceInput = wrapper.find('input[placeholder="TXT_CODE_AUTOUPDATE_WEB_SOURCE_PH"]');
    expect(sourceInput.exists()).toBe(true);
    expect((sourceInput.element as HTMLInputElement).value).toBe("https://example.com/manifest.json");

    expect(wrapper.text()).toContain("TXT_CODE_AUTOUPDATE_WEB_SOURCE_DESC");
    expect(wrapper.text()).toContain("TXT_CODE_AUTOUPDATE_WEB_ACTION_DESC");
  });

  it("shows the release notes matching the current panel language", async () => {
    mocks.upgradeInfoExecute.mockResolvedValue({
      value: upgradeInfo({ onlineNotes: { zh_cn: "zh line 1\nzh line 2", en_us: "en line 1" } })
    });
    await mountSettings();
    await openAutoUpdateTab();

    expect(wrapper.text()).toContain("TXT_CODE_AUTOUPDATE_WEB_NOTES");
    expect(wrapper.text()).toContain("zh line 1");
    expect(wrapper.text()).toContain("zh line 2");
    expect(wrapper.text()).not.toContain("en line 1");
    expect(wrapper.find(".update-notes-body").exists()).toBe(true);
  });

  it("falls back to English release notes when the panel language is missing", async () => {
    mocks.upgradeInfoExecute.mockResolvedValue({
      value: upgradeInfo({ onlineNotes: { en_us: "en fallback line", ja_jp: "ja line" } })
    });
    await mountSettings();
    await openAutoUpdateTab();

    expect(wrapper.text()).toContain("en fallback line");
    expect(wrapper.text()).not.toContain("ja line");
  });

  it("hides the release notes box when there is no update or no notes", async () => {
    mocks.upgradeInfoExecute.mockResolvedValue({
      value: upgradeInfo({
        onlineNotes: { zh_cn: "note line 1" },
        updateAvailable: false,
        onlineVersion: "10.0.0"
      })
    });
    await mountSettings();
    await openAutoUpdateTab();

    expect(wrapper.find(".update-notes-box").exists()).toBe(false);
    expect(wrapper.text()).not.toContain("note line 1");

    wrapper.unmount();
    mocks.upgradeInfoExecute.mockResolvedValue({
      value: upgradeInfo({ onlineNotes: undefined })
    });
    await mountSettings();
    await openAutoUpdateTab();

    expect(wrapper.find(".update-notes-box").exists()).toBe(false);
    expect(wrapper.text()).not.toContain("TXT_CODE_AUTOUPDATE_WEB_NOTES");
  });

  it("disables the update button when no update is available or not configured", async () => {
    mocks.upgradeInfoExecute.mockResolvedValue({
      value: upgradeInfo({ updateAvailable: false, onlineVersion: "10.0.0" })
    });
    await mountSettings();
    await openAutoUpdateTab();

    expect(wrapper.text()).toContain("TXT_CODE_AUTOUPDATE_UP_TO_DATE");
    expect(findButton("TXT_CODE_AUTOUPDATE_WEB_BTN")!.attributes("disabled")).toBeDefined();

    wrapper.unmount();
    mocks.upgradeInfoExecute.mockResolvedValue({
      value: upgradeInfo({ configured: false, updateAvailable: false })
    });
    await mountSettings();
    await openAutoUpdateTab();

    expect(wrapper.text()).toContain("TXT_CODE_AUTOUPDATE_WEB_NOT_CONFIGURED");
    expect(findButton("TXT_CODE_AUTOUPDATE_WEB_BTN")!.attributes("disabled")).toBeDefined();
  });

  it("enables the update button when configured and a new version exists", async () => {
    await mountSettings();
    await openAutoUpdateTab();

    expect(findButton("TXT_CODE_AUTOUPDATE_WEB_BTN")!.attributes("disabled")).toBeUndefined();
  });

  it("saves updateSourceUrl via setSettingInfo", async () => {
    await mountSettings();
    await openAutoUpdateTab();

    const sourceInput = wrapper.find('input[placeholder="TXT_CODE_AUTOUPDATE_WEB_SOURCE_PH"]');
    await sourceInput.setValue("https://new-source.example.com/manifest.json");

    const messageSpy = vi.spyOn(message, "success").mockImplementation((() => ({})) as any);
    await findButton("TXT_CODE_AUTOUPDATE_WEB_SAVE")!.trigger("click");
    await flushPromises();

    expect(mocks.submitExecute).toHaveBeenCalledTimes(1);
    const payload = mocks.submitExecute.mock.calls[0][0];
    expect(payload.data.updateSourceUrl).toBe("https://new-source.example.com/manifest.json");
    expect(messageSpy).toHaveBeenCalledWith("TXT_CODE_a7907771");
  });

  it("refreshes upgrade info via getPanelUpgradeInfo", async () => {
    await mountSettings();
    expect(mocks.upgradeInfoExecute).toHaveBeenCalled();

    await openAutoUpdateTab();
    const before = mocks.upgradeInfoExecute.mock.calls.length;
    await findButton("TXT_CODE_AUTOUPDATE_BTN_REFRESH")!.trigger("click");
    await flushPromises();
    expect(mocks.upgradeInfoExecute.mock.calls.length).toBe(before + 1);
  });

  it("runs the panel update flow: confirm -> upgradePanel -> restart-required modal", async () => {
    mocks.upgradePanelExecute.mockResolvedValue({
      value: { started: true, onlineVersion: "10.18.4" }
    });

    await mountSettings();
    await openAutoUpdateTab();

    let confirmOptions: any = null;
    const confirmSpy = vi
      .spyOn(Modal, "confirm")
      .mockImplementation(((opts: any) => {
        confirmOptions = opts;
        return {} as any;
      }) as any);
    const successSpy = vi.spyOn(Modal, "success").mockImplementation((() => ({})) as any);

    await findButton("TXT_CODE_AUTOUPDATE_WEB_BTN")!.trigger("click");
    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(confirmOptions.title).toBe("TXT_CODE_AUTOUPDATE_WEB_BTN");
    expect(confirmOptions.content).toBe("TXT_CODE_AUTOUPDATE_WEB_CONFIRM");

    await confirmOptions.onOk();
    await flushPromises();

    // update applied on disk; the panel is NOT restarted automatically ->
    // a modal tells the operator to restart it manually
    expect(mocks.upgradePanelExecute).toHaveBeenCalledTimes(1);
    expect(successSpy).toHaveBeenCalledTimes(1);
    expect(String(successSpy.mock.calls[0][0]?.content)).toContain(
      "TXT_CODE_AUTOUPDATE_WEB_SUCCESS"
    );
    expect(String(successSpy.mock.calls[0][0]?.content)).toContain("{v}=10.18.4");
  });

  it("keeps the panel offline message when the update is not started", async () => {
    mocks.upgradePanelExecute.mockResolvedValue({
      value: { started: false, message: "TXT_CODE_AUTOUPDATE_ALREADY_LATEST" }
    });
    await mountSettings();
    await openAutoUpdateTab();

    let confirmOptions: any = null;
    vi.spyOn(Modal, "confirm").mockImplementation(((opts: any) => {
      confirmOptions = opts;
      return {} as any;
    }) as any);
    const successSpy = vi.spyOn(Modal, "success").mockImplementation((() => ({})) as any);
    const messageInfoSpy = vi.spyOn(message, "info").mockImplementation((() => ({})) as any);

    await findButton("TXT_CODE_AUTOUPDATE_WEB_BTN")!.trigger("click");
    await confirmOptions.onOk();
    await flushPromises();

    expect(mocks.upgradePanelExecute).toHaveBeenCalledTimes(1);
    expect(messageInfoSpy).toHaveBeenCalledWith("TXT_CODE_AUTOUPDATE_ALREADY_LATEST");
    expect(successSpy).not.toHaveBeenCalled();
  });
});
