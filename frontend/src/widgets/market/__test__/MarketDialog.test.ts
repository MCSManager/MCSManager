// @vitest-environment jsdom

import { flushPromises, shallowMount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MarketDialog from "../MarketDialog.vue";

const mocks = vi.hoisted(() => ({
  routerPush: vi.fn(),
  destroyComponent: vi.fn()
}));

vi.mock("@/config/router", () => ({
  router: { push: mocks.routerPush }
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
  default: { name: "McPreset" }
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

    wrapper.findComponent({ name: "McPreset" }).vm.$emit("install-started");
    await flushPromises();
    await dialogResult;

    expect(mocks.destroyComponent).toHaveBeenCalledTimes(1);
  });
});
