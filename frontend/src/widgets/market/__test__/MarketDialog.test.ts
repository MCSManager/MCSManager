// @vitest-environment jsdom

import { flushPromises, shallowMount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MarketDialog from "../MarketDialog.vue";

const mocks = vi.hoisted(() => ({
  routerPush: vi.fn(),
  destroyComponent: vi.fn(),
  openNodeSelectDialog: vi.fn(),
  getOverviewInfo: vi.fn(),
  reportErrorMsg: vi.fn(),
  routeQuery: {} as Record<string, string | undefined>
}));

vi.mock("@/components/fc", () => ({
  openNodeSelectDialog: mocks.openNodeSelectDialog
}));

vi.mock("@/config/router", () => ({
  router: {
    push: mocks.routerPush,
    currentRoute: { value: { query: mocks.routeQuery } }
  }
}));

vi.mock("@/services/apis", () => ({
  overviewInfo: () => ({
    execute: mocks.getOverviewInfo
  })
}));

vi.mock("@/tools/validator", () => ({
  reportErrorMsg: mocks.reportErrorMsg
}));

vi.mock("@/lang/i18n", () => ({
  t: (key: string) => key,
  $t: (key: string) => key
}));

vi.mock("@/stores/useAppStateStore", () => ({
  useAppStateStore: () => ({ isAdmin: false })
}));

vi.mock("@/widgets/market/useMarketTour", async () => {
  const { ref } = await vi.importActual<typeof import("vue")>("vue");
  return {
    useMarketTour: () => ({
      step3Ref: ref(null),
      openTour: ref(false),
      tourCurrent: ref(0),
      tourSteps: ref([]),
      setStepRef: vi.fn(),
      markTourDone: vi.fn()
    })
  };
});

vi.mock("@/widgets/setupApp/McPreset.vue", () => ({
  default: { name: "McPreset", props: ["card", "initialCategory", "initialNode"] }
}));

vi.mock("@/widgets/setupApp/AppPackages.vue", () => ({
  default: { name: "AppPackages" }
}));

vi.mock("@/widgets/market/MarketCreateMethodStep.vue", () => ({
  default: { name: "MarketCreateMethodStep", props: ["categoryTitle"] }
}));

vi.mock("@/widgets/setupApp/CreateInstanceForm.vue", () => ({
  default: { name: "CreateInstanceForm", props: ["createMethod", "daemonId"] }
}));

const mountDialog = () =>
  shallowMount(MarketDialog, {
    props: { destroyComponent: mocks.destroyComponent },
    global: {
      renderStubDefaultSlot: true,
      stubs: {
        AModal: { template: "<div><slot /></div>" },
        Link: {
          emits: ["click"],
          template: '<button v-bind="$attrs" @click="$emit(\'click\', $event)"><slot /></button>'
        }
      }
    }
  });

describe("MarketDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete mocks.routeQuery.daemonId;
    mocks.openNodeSelectDialog.mockResolvedValue({ uuid: "node-1" });
    mocks.getOverviewInfo.mockResolvedValue({
      value: {
        remote: [
          { available: true, uuid: "node-1" },
          { available: true, uuid: "node-2" }
        ]
      }
    });
  });

  it("closes when opening the market editor", async () => {
    const wrapper = mountDialog();
    const dialogResult = wrapper.vm.openDialog().catch(() => undefined);

    await wrapper.get('[data-testid="market-editor-link"]').trigger("click");
    await flushPromises();
    await dialogResult;

    expect(mocks.routerPush).toHaveBeenCalledWith("/market/editor");
    expect(mocks.destroyComponent).toHaveBeenCalledTimes(1);
  });

  it("closes when a preset installation starts", async () => {
    const wrapper = mountDialog();
    const dialogResult = wrapper.vm.openDialog().catch(() => undefined);

    const category = { title: "Minecraft", gameType: "Minecraft" };
    wrapper.findComponent({ name: "AppPackages" }).vm.$emit("handle-select-category", category);
    await flushPromises();
    wrapper.findComponent({ name: "MarketCreateMethodStep" }).vm.$emit("select", "preset");
    await flushPromises();

    wrapper.findComponent({ name: "McPreset" }).vm.$emit("install-started");
    await flushPromises();
    await dialogResult;

    expect(mocks.destroyComponent).toHaveBeenCalledTimes(1);
  });

  it("opens the selected category in the preset branch and returns to methods", async () => {
    const wrapper = mountDialog();
    const category = { title: "Minecraft", gameType: "Minecraft" };

    wrapper.findComponent({ name: "AppPackages" }).vm.$emit("handle-select-category", category);
    await flushPromises();

    const methodStep = wrapper.findComponent({ name: "MarketCreateMethodStep" });
    expect(methodStep.props("categoryTitle")).toBe("Minecraft");

    methodStep.vm.$emit("select", "preset");
    await flushPromises();

    const preset = wrapper.findComponent({ name: "McPreset" });
    expect(preset.props("initialCategory")).toEqual(category);
    expect(preset.props("card").meta.daemonId).toBe("node-1");
    expect(preset.props("initialNode")).toEqual({ uuid: "node-1" });
    expect(mocks.openNodeSelectDialog).toHaveBeenCalledTimes(1);

    preset.vm.$emit("back");
    await flushPromises();
    expect(wrapper.findComponent({ name: "MarketCreateMethodStep" }).exists()).toBe(true);
  });

  it("reuses the selected node when switching from manual creation to presets", async () => {
    const wrapper = mountDialog();
    const node = {
      uuid: "node-2",
      system: { type: "Windows_NT" },
      dockerPlatforms: ["linux/amd64"]
    };
    mocks.openNodeSelectDialog.mockResolvedValue(node);

    wrapper.findComponent({ name: "AppPackages" }).vm.$emit("handle-select-category", {
      title: "Minecraft",
      gameType: "Minecraft"
    });
    await flushPromises();
    wrapper.findComponent({ name: "MarketCreateMethodStep" }).vm.$emit("select", "IMPORT");
    await flushPromises();
    wrapper.findComponent({ name: "CreateInstanceForm" }).vm.$emit("back");
    await flushPromises();
    wrapper.findComponent({ name: "MarketCreateMethodStep" }).vm.$emit("select", "preset");
    await flushPromises();

    const preset = wrapper.findComponent({ name: "McPreset" });
    expect(preset.props("card").meta.daemonId).toBe("node-2");
    expect(preset.props("initialNode")).toEqual(node);

    preset.vm.$emit("back");
    await flushPromises();
    wrapper.findComponent({ name: "MarketCreateMethodStep" }).vm.$emit("select", "DOCKER");
    await flushPromises();

    expect(wrapper.findComponent({ name: "CreateInstanceForm" }).props("daemonId")).toBe("node-2");
    expect(mocks.getOverviewInfo).toHaveBeenCalledTimes(1);
    expect(mocks.openNodeSelectDialog).toHaveBeenCalledTimes(1);
  });

  it("opens the existing form for manual methods and navigates after creation", async () => {
    const wrapper = mountDialog();
    const dialogResult = wrapper.vm.openDialog().catch(() => undefined);

    wrapper.findComponent({ name: "AppPackages" }).vm.$emit("handle-select-category", {
      title: "Minecraft",
      gameType: "Minecraft"
    });
    await flushPromises();
    wrapper.findComponent({ name: "MarketCreateMethodStep" }).vm.$emit("select", "IMPORT");
    await flushPromises();

    expect(mocks.openNodeSelectDialog).toHaveBeenCalledTimes(1);
    const form = wrapper.findComponent({ name: "CreateInstanceForm" });
    expect(form.props("createMethod")).toBe("IMPORT");
    expect(form.props("daemonId")).toBe("node-1");

    form.vm.$emit("next-step", "instance-1");
    await flushPromises();
    await dialogResult;

    expect(mocks.routerPush).toHaveBeenCalledWith({
      path: "/instances/terminal",
      query: {
        daemonId: "node-1",
        instanceId: "instance-1"
      }
    });
    expect(mocks.destroyComponent).toHaveBeenCalledTimes(1);
  });

  it("reuses a daemon from the current route for manual methods", async () => {
    mocks.routeQuery.daemonId = "route-node";
    const wrapper = mountDialog();

    wrapper.findComponent({ name: "AppPackages" }).vm.$emit("handle-select-category", {
      title: "Minecraft",
      gameType: "Minecraft"
    });
    await flushPromises();
    wrapper.findComponent({ name: "MarketCreateMethodStep" }).vm.$emit("select", "IMPORT");
    await flushPromises();

    expect(mocks.getOverviewInfo).not.toHaveBeenCalled();
    expect(mocks.openNodeSelectDialog).not.toHaveBeenCalled();
    const form = wrapper.findComponent({ name: "CreateInstanceForm" });
    expect(form.props("createMethod")).toBe("IMPORT");
    expect(form.props("daemonId")).toBe("route-node");

    form.vm.$emit("back");
    await flushPromises();
    wrapper.findComponent({ name: "MarketCreateMethodStep" }).vm.$emit("select", "preset");
    await flushPromises();
    const preset = wrapper.findComponent({ name: "McPreset" });
    expect(preset.props("card").meta.daemonId).toBe("route-node");

    preset.vm.$emit("back");
    await flushPromises();
    wrapper.findComponent({ name: "MarketCreateMethodStep" }).vm.$emit("select", "IMPORT");
    await flushPromises();
    expect(wrapper.findComponent({ name: "CreateInstanceForm" }).props("daemonId")).toBe(
      "route-node"
    );
    expect(mocks.openNodeSelectDialog).not.toHaveBeenCalled();
  });

  it.each(["preset", "IMPORT"])("blocks %s creation when the overview is empty", async (method) => {
    mocks.getOverviewInfo.mockResolvedValueOnce(undefined);
    const wrapper = mountDialog();

    wrapper.findComponent({ name: "AppPackages" }).vm.$emit("handle-select-category", {
      title: "Minecraft",
      gameType: "Minecraft"
    });
    await flushPromises();
    wrapper.findComponent({ name: "MarketCreateMethodStep" }).vm.$emit("select", method);
    await flushPromises();

    expect(mocks.openNodeSelectDialog).not.toHaveBeenCalled();
    expect(wrapper.findComponent({ name: "CreateInstanceForm" }).exists()).toBe(false);
    expect(wrapper.findComponent({ name: "McPreset" }).exists()).toBe(false);
    expect(mocks.reportErrorMsg).toHaveBeenCalledWith("TXT_CODE_e3d96a26");
  });

  it("stays on method selection when preset node selection is cancelled", async () => {
    mocks.openNodeSelectDialog.mockResolvedValue(undefined);
    const wrapper = mountDialog();

    wrapper.findComponent({ name: "AppPackages" }).vm.$emit("handle-select-category", {
      gameType: "Minecraft"
    });
    await flushPromises();
    wrapper.findComponent({ name: "MarketCreateMethodStep" }).vm.$emit("select", "preset");
    await flushPromises();

    expect(wrapper.findComponent({ name: "MarketCreateMethodStep" }).exists()).toBe(true);
    expect(wrapper.findComponent({ name: "McPreset" }).exists()).toBe(false);
  });
});
