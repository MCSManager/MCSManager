// @vitest-environment jsdom
// Node card tests for the remote daemon self-update affordances:
// - the top-right "Update Daemon" button turns yellow when the update manifest
//   advertises a newer version
// - hovering it shows a tooltip with the online version + the localized
//   release notes (panel language match, English fallback)
// - the version field keeps the original panel/daemon diff warning, decoupled
//   from the upgrade manifest
// - the update runs through the top-right "Update Daemon" button group
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { Modal } from "ant-design-vue";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import IconBtn from "@/components/IconBtn.vue";
import NodeItem from "@/widgets/node/NodeItem.vue";

const mocks = vi.hoisted(() => ({
  daemonUpgradeInfoExecute: vi.fn(),
  upgradeDaemonExecute: vi.fn(),
  connectNodeExecute: vi.fn(),
  testFrontendSocket: vi.fn(),
  reportErrorMsg: vi.fn()
}));

vi.mock("@/services/apis", () => ({
  connectNode: () => ({ execute: mocks.connectNodeExecute }),
  upgradeDaemon: () => ({ execute: mocks.upgradeDaemonExecute }),
  getDaemonUpgradeInfo: () => ({ execute: mocks.daemonUpgradeInfoExecute })
}));

vi.mock("@/hooks/useOverviewInfo", () => ({
  useOverviewInfo: () => ({
    state: {
      value: {
        specifiedDaemonVersion: "4.18.3",
        remote: []
      }
    }
  })
}));

vi.mock("@/hooks/useSocketIo", () => ({
  SocketStatus: { Connected: "Connected", Connecting: "Connecting", Error: "Error" },
  useSocketIoClient: () => ({
    testFrontendSocket: mocks.testFrontendSocket,
    socketStatus: { value: "Connected" }
  })
}));

vi.mock("@/hooks/useAppRouters", () => ({
  useAppRouters: () => ({ toPage: vi.fn() })
}));

vi.mock("@/hooks/useCardTools", () => ({
  useLayoutCardTools: () => ({ getMetaOrRouteValue: () => undefined })
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
  getCurrentLang: () => "zh_cn"
}));

vi.mock("@/tools/validator", () => ({
  reportErrorMsg: mocks.reportErrorMsg
}));

vi.mock("@/components/NodeSimpleChart.vue", () => ({
  default: { name: "NodeSimpleChart", setup: () => () => null }
}));

vi.mock("@/widgets/node/NodeDetailDialog.vue", () => ({
  default: { name: "NodeDetailDialog", setup: () => () => null }
}));

const nodeItem = (overrides = {}) => ({
  uuid: "node-1",
  ip: "1.2.3.4",
  port: 24444,
  available: true,
  version: "4.18.3",
  remarks: "test-node",
  ...overrides
});

// ant-design-vue tooltips open after a short mouseEnterDelay (default 0.1s),
// so the popup (rendered into document.body) needs real time to appear.
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const findUpdateBtn = () =>
  wrapper
    .findAllComponents(IconBtn)
    .find((btn) => btn.props("title") === "TXT_CODE_AUTOUPDATE_DAEMON_BTN");

const openUpdateTooltip = async () => {
  const updateBtn = findUpdateBtn();
  await updateBtn!.find("span.btn").trigger("mouseenter");
  await sleep(300);
  await flushPromises();
};

const daemonUpgradeInfo = (overrides = {}) => ({
  configured: true,
  currentVersion: "4.18.3",
  onlineVersion: "4.18.4",
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

const mountNodeItem = async (item = nodeItem()) => {
  wrapper = mount(NodeItem, {
    props: { item: item as any }
  });
  await flushPromises();
  return wrapper;
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.daemonUpgradeInfoExecute.mockResolvedValue({ value: daemonUpgradeInfo() });
  mocks.upgradeDaemonExecute.mockResolvedValue({ value: { started: true, onlineVersion: "4.18.4" } });
});

afterEach(() => {
  wrapper?.unmount();
  vi.restoreAllMocks();
});

describe("NodeItem.vue daemon update affordances", () => {
  it("turns the update button yellow and shows the localized notes on hover", async () => {
    mocks.daemonUpgradeInfoExecute.mockResolvedValue({
      value: daemonUpgradeInfo({
        onlineNotes: { zh_cn: "zh note line", en_us: "en note line" }
      })
    });
    await mountNodeItem();

    expect(mocks.daemonUpgradeInfoExecute).toHaveBeenCalled();
    const updateBtn = findUpdateBtn();
    expect(updateBtn).toBeTruthy();
    expect(updateBtn!.find("span.btn").classes()).toContain("color-warning");

    await openUpdateTooltip();

    const bodyText = document.body.textContent || "";
    expect(bodyText).toContain("TXT_CODE_AUTOUPDATE_DAEMON_UPDATE_TIP");
    expect(bodyText).toContain("{v}=4.18.4");
    expect(bodyText).toContain("zh note line");
    expect(bodyText).not.toContain("en note line");
  });

  it("falls back to English notes in the tooltip when the panel language is missing", async () => {
    mocks.daemonUpgradeInfoExecute.mockResolvedValue({
      value: daemonUpgradeInfo({ onlineNotes: { en_us: "en fallback line", ja_jp: "ja line" } })
    });
    await mountNodeItem();

    await openUpdateTooltip();

    const bodyText = document.body.textContent || "";
    expect(bodyText).toContain("en fallback line");
    expect(bodyText).not.toContain("ja line");
  });

  it("leaves the update button uncolored when no update is available", async () => {
    mocks.daemonUpgradeInfoExecute.mockResolvedValue({
      value: daemonUpgradeInfo({ updateAvailable: false, onlineVersion: "4.18.3" })
    });
    await mountNodeItem();

    const updateBtn = findUpdateBtn();
    expect(updateBtn).toBeTruthy();
    expect(updateBtn!.find("span.btn").classes()).not.toContain("color-warning");
    expect(updateBtn!.props("tooltip")).toBeUndefined();
  });

  it("does not query the daemon while the node is offline", async () => {
    await mountNodeItem(nodeItem({ available: false }));

    expect(mocks.daemonUpgradeInfoExecute).not.toHaveBeenCalled();
    // The update entry is hidden entirely for an offline node.
    expect(findUpdateBtn()).toBeUndefined();
  });

  it("keeps the original version diff warning, decoupled from the update manifest", async () => {
    await mountNodeItem(nodeItem({ version: "4.17.0", available: true }));

    const dangerTexts = wrapper.findAll(".color-danger").map((node) => node.text());
    expect(dangerTexts.some((text) => text.includes("4.17.0"))).toBe(true);
  });

  it("shows the version as success when it matches the panel requirement", async () => {
    await mountNodeItem(nodeItem({ version: "4.18.9", available: true }));

    const dangerTexts = wrapper.findAll(".color-danger").map((node) => node.text());
    expect(dangerTexts.some((text) => text.includes("4.18.9"))).toBe(false);
  });

  it("runs the daemon update from the top-right button group", async () => {
    await mountNodeItem();

    let confirmOptions: any = null;
    vi.spyOn(Modal, "confirm").mockImplementation(((opts: any) => {
      confirmOptions = opts;
      return {} as any;
    }) as any);

    const updateBtn = wrapper
      .findAllComponents(IconBtn)
      .find((btn) => btn.props("title") === "TXT_CODE_AUTOUPDATE_DAEMON_BTN");
    expect(updateBtn, "Update Daemon button exists in the operator group").toBeTruthy();

    await updateBtn!.find("span.btn").trigger("click");
    expect(confirmOptions.title).toBe("TXT_CODE_AUTOUPDATE_DAEMON_BTN");

    const successSpy = vi.spyOn(Modal, "success").mockImplementation((() => ({})) as any);
    await confirmOptions.onOk();
    await flushPromises();

    expect(mocks.upgradeDaemonExecute).toHaveBeenCalledTimes(1);
    expect(mocks.upgradeDaemonExecute.mock.calls[0][0]).toEqual({
      params: { uuid: "node-1" }
    });
    // Update applied on disk -> modal asks the operator to restart manually
    expect(successSpy).toHaveBeenCalledTimes(1);
    expect(String(successSpy.mock.calls[0][0]?.content)).toContain(
      "TXT_CODE_AUTOUPDATE_DAEMON_STARTED"
    );
    expect(String(successSpy.mock.calls[0][0]?.content)).toContain("{v}=4.18.4");
  });
});
