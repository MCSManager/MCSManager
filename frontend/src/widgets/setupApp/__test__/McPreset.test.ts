// @vitest-environment jsdom

import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import McPreset from "../McPreset.vue";

const mocks = vi.hoisted(() => ({
  executeCreateAsyncTask: vi.fn(),
  messageInfo: vi.fn(),
  routerPush: vi.fn(),
  newTaskInfo: { value: { instanceUuid: "instance-1" } }
}));

vi.mock("@/components/fc", () => ({
  openNodeSelectDialog: vi.fn()
}));

vi.mock("@/config/router", () => ({
  router: { push: mocks.routerPush }
}));

vi.mock("@/hooks/useCardTools", () => ({
  useLayoutCardTools: () => ({ getMetaOrRouteValue: () => "daemon-1" })
}));

vi.mock("@/lang/i18n", () => ({
  t: (key: string) => key
}));

vi.mock("@/services/apis/envImage", () => ({
  getDockerHubImagePlatforms: vi.fn()
}));

vi.mock("@/services/apis/instance", () => ({
  createAsyncTask: () => ({
    state: mocks.newTaskInfo,
    execute: mocks.executeCreateAsyncTask
  })
}));

vi.mock("@/tools/validator", () => ({
  reportErrorMsg: vi.fn()
}));

vi.mock("@/widgets/setupApp/AppPackages.vue", () => ({
  default: { name: "AppPackages", template: "<div />" }
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
    mocks.executeCreateAsyncTask.mockResolvedValue(undefined);
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

    wrapper.findComponent({ name: "TemplateNameDialog" }).vm.$emit(
      "confirm",
      "Test Server",
      template
    );
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
});
