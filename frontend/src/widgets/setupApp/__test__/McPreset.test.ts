// @vitest-environment jsdom

import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import McPreset from "../McPreset.vue";

const mocks = vi.hoisted(() => ({
  executeCreateAsyncTask: vi.fn(),
  getDockerHubImagePlatforms: vi.fn(),
  getOverviewInfo: vi.fn(),
  handleSelectTopCategory: vi.fn(),
  messageInfo: vi.fn(),
  openNodeSelectDialog: vi.fn(),
  reportErrorMsg: vi.fn(),
  routerPush: vi.fn(),
  newTaskInfo: { value: { instanceUuid: "instance-1" } },
  initialDaemonId: "daemon-1",
  overviewNodes: [] as Array<{ available: boolean; uuid: string }>
}));

vi.mock("@/components/fc", () => ({
  openNodeSelectDialog: mocks.openNodeSelectDialog
}));

vi.mock("@/config/router", () => ({
  router: { push: mocks.routerPush }
}));

vi.mock("@/hooks/useCardTools", () => ({
  useLayoutCardTools: () => ({ getMetaOrRouteValue: () => mocks.initialDaemonId })
}));

vi.mock("@/lang/i18n", () => ({
  t: (key: string) => key
}));

vi.mock("@/services/apis", () => ({
  overviewInfo: () => ({
    execute: mocks.getOverviewInfo
  })
}));

vi.mock("@/services/apis/envImage", () => ({
  getDockerHubImagePlatforms: () => ({
    execute: mocks.getDockerHubImagePlatforms
  })
}));

vi.mock("@/services/apis/instance", () => ({
  createAsyncTask: () => ({
    state: mocks.newTaskInfo,
    execute: mocks.executeCreateAsyncTask
  })
}));

vi.mock("@/tools/validator", () => ({
  reportErrorMsg: mocks.reportErrorMsg
}));

vi.mock("@/widgets/setupApp/AppPackages.vue", () => ({
  default: {
    name: "AppPackages",
    methods: { handleSelectTopCategory: mocks.handleSelectTopCategory },
    template: "<div />"
  }
}));

vi.mock("@/widgets/instance/dialogs/TemplateNameDialog.vue", () => ({
  default: {
    name: "TemplateNameDialog",
    props: ["open", "template"],
    emits: ["update:open", "confirm"],
    template: "<div />"
  }
}));

vi.mock("ant-design-vue", () => ({
  message: { info: mocks.messageInfo }
}));

describe("McPreset", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mocks.initialDaemonId = "daemon-1";
    mocks.overviewNodes = [];
    mocks.executeCreateAsyncTask.mockResolvedValue(undefined);
    mocks.getDockerHubImagePlatforms.mockResolvedValue({ value: [] });
    mocks.getOverviewInfo.mockImplementation(async () => ({
      value: { remote: mocks.overviewNodes }
    }));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("emits after starting a preset installation", async () => {
    const wrapper = mount(McPreset, {
      props: { card: { meta: {} } as any }
    });
    const template = {
      targetLink: "https://example.com/template.zip",
      setupInfo: { docker: {} }
    } as any;

    wrapper
      .findComponent({ name: "TemplateNameDialog" })
      .vm.$emit("confirm", "Test Server", template);
    await flushPromises();

    expect(mocks.executeCreateAsyncTask).toHaveBeenCalledTimes(1);
    expect(mocks.messageInfo).toHaveBeenCalledTimes(1);
    expect(wrapper.emitted("install-started")).toHaveLength(1);

    vi.runAllTimers();
    expect(mocks.routerPush).toHaveBeenCalledWith({
      path: "/instances/terminal",
      query: {
        daemonId: "daemon-1",
        instanceId: "instance-1"
      }
    });
  });

  it("reports an error when no online node is available", async () => {
    mocks.initialDaemonId = "";
    mocks.overviewNodes = [{ available: false, uuid: "offline-node" }];
    const wrapper = mount(McPreset, {
      props: { card: { meta: {} } as any }
    });

    wrapper.findComponent({ name: "AppPackages" }).vm.$emit("handle-select-category", {
      gameType: "Minecraft"
    });
    await flushPromises();

    expect(mocks.getOverviewInfo).toHaveBeenCalledTimes(1);
    expect(mocks.reportErrorMsg).toHaveBeenCalledWith("TXT_CODE_e3d96a26");
    expect(mocks.openNodeSelectDialog).not.toHaveBeenCalled();
    expect(mocks.handleSelectTopCategory).not.toHaveBeenCalled();
  });

  it("uses the only online node without opening the selection dialog", async () => {
    mocks.initialDaemonId = "";
    mocks.overviewNodes = [
      { available: false, uuid: "offline-node" },
      { available: true, uuid: "online-node" }
    ];
    const wrapper = mount(McPreset, {
      props: { card: { meta: {} } as any }
    });

    const category = { gameType: "Minecraft" };
    wrapper.findComponent({ name: "AppPackages" }).vm.$emit("handle-select-category", category);
    await flushPromises();

    expect(mocks.openNodeSelectDialog).not.toHaveBeenCalled();
    expect(mocks.handleSelectTopCategory).toHaveBeenCalledWith(
      category,
      expect.objectContaining({ uuid: "online-node" })
    );

    wrapper.findComponent({ name: "TemplateNameDialog" }).vm.$emit("confirm", "Test Server", {
      setupInfo: { docker: {} }
    });
    await flushPromises();

    expect(mocks.executeCreateAsyncTask).toHaveBeenCalledWith(
      expect.objectContaining({ params: expect.objectContaining({ daemonId: "online-node" }) })
    );
  });

  it("opens the selection dialog when multiple online nodes are available", async () => {
    mocks.initialDaemonId = "";
    mocks.overviewNodes = [
      { available: true, uuid: "online-node-1" },
      { available: true, uuid: "online-node-2" }
    ];
    mocks.openNodeSelectDialog.mockResolvedValue({ uuid: "online-node-2" });
    const wrapper = mount(McPreset, {
      props: { card: { meta: {} } as any }
    });

    const category = { gameType: "Minecraft" };
    wrapper.findComponent({ name: "AppPackages" }).vm.$emit("handle-select-category", category);
    await flushPromises();

    expect(mocks.openNodeSelectDialog).toHaveBeenCalledTimes(1);
    expect(mocks.handleSelectTopCategory).toHaveBeenCalledWith(
      category,
      expect.objectContaining({ uuid: "online-node-2" })
    );
  });

  it("opens an initial category and emits back to the parent flow", async () => {
    const category = { gameType: "Minecraft" } as any;
    const wrapper = mount(McPreset, {
      props: {
        card: { meta: {} } as any,
        initialCategory: category
      }
    });
    await flushPromises();

    expect(mocks.handleSelectTopCategory).toHaveBeenCalledWith(category, undefined);

    wrapper.findComponent({ name: "AppPackages" }).vm.$emit("handle-back-to-category");
    expect(wrapper.emitted("back")).toHaveLength(1);
  });

  it("keeps Docker platform filtering as the confirmation fallback", async () => {
    mocks.initialDaemonId = "";
    mocks.getDockerHubImagePlatforms.mockResolvedValue({ value: ["linux/amd64"] });
    mocks.openNodeSelectDialog.mockResolvedValue({ uuid: "docker-node" });
    const wrapper = mount(McPreset, {
      props: { card: { meta: {} } as any }
    });

    wrapper.findComponent({ name: "TemplateNameDialog" }).vm.$emit("confirm", "Test Server", {
      setupInfo: { docker: { image: "example/server:latest" } }
    });
    await flushPromises();

    expect(mocks.openNodeSelectDialog).toHaveBeenCalledWith(["linux/amd64"]);
    expect(mocks.executeCreateAsyncTask).toHaveBeenCalledWith(
      expect.objectContaining({ params: expect.objectContaining({ daemonId: "docker-node" }) })
    );
  });

  it("uses the market-selected node for filtering and installation without selecting again", async () => {
    mocks.initialDaemonId = "";
    mocks.openNodeSelectDialog.mockResolvedValue({ uuid: "online-node-1" });
    mocks.overviewNodes = [
      { available: true, uuid: "online-node-1" },
      { available: true, uuid: "online-node-2" }
    ];
    const node = {
      uuid: "online-node-2",
      system: { type: "Windows_NT" },
      dockerPlatforms: ["linux/amd64"]
    } as any;
    const category = { gameType: "Minecraft" } as any;
    const wrapper = mount(McPreset, {
      props: { card: { meta: {} } as any, initialCategory: category, initialNode: node }
    });
    await flushPromises();

    expect(mocks.handleSelectTopCategory).toHaveBeenCalledWith(category, node);
    wrapper.findComponent({ name: "TemplateNameDialog" }).vm.$emit("confirm", "Test Server", {
      setupInfo: { docker: {} }
    });
    await flushPromises();

    expect(mocks.getOverviewInfo).not.toHaveBeenCalled();
    expect(mocks.openNodeSelectDialog).not.toHaveBeenCalled();
    expect(mocks.executeCreateAsyncTask).toHaveBeenCalledWith(
      expect.objectContaining({ params: expect.objectContaining({ daemonId: "online-node-2" }) })
    );
  });
});
