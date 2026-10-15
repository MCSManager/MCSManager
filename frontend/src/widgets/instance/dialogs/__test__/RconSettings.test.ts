// @vitest-environment jsdom
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { Input, Select, Switch, message } from "ant-design-vue";
import { defineComponent, h } from "vue";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import RconSettings from "../RconSettings.vue";
import InstanceFundamentalDetail from "../InstanceFundamentalDetail.vue";

const mocks = vi.hoisted(() => ({ admin: false, execute: vi.fn(), reportError: vi.fn() }));
vi.mock("@/stores/useAppStateStore", async () => {
  const { computed } = await import("vue");
  return { useAppStateStore: () => ({ isAdmin: computed(() => mocks.admin) }) };
});
vi.mock("@/services/apis/instance", () => ({
  updateInstanceConfig: () => ({ execute: mocks.execute, isLoading: false })
}));
vi.mock("@/lang/i18n", () => ({ t: (key: string) => key }));
vi.mock("@/tools/validator", () => ({ reportErrorMsg: mocks.reportError }));
vi.mock("@/components/fc", () => ({ useDockerEnvEditDialog: vi.fn() }));
vi.mock("@/hooks/useInstance", () => ({
  INSTANCE_TYPE_TRANSLATION: {},
  TYPE_UNIVERSAL: "universal"
}));

beforeAll(() => {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  });
});

let wrapper: VueWrapper<any>;
const ModalStub = defineComponent({
  name: "AModal",
  props: {
    open: Boolean,
    footer: { type: null, default: undefined }
  },
  emits: ["ok"],
  setup:
    (props, { slots }) =>
    () =>
      props.open ? h("section", slots.default?.()) : null
});
beforeEach(() => {
  mocks.admin = false;
  mocks.execute.mockReset().mockResolvedValue({});
  mocks.reportError.mockReset();
  vi.spyOn(message, "success").mockImplementation((() => ({})) as any);
});
afterEach(() => {
  wrapper?.unmount();
  vi.restoreAllMocks();
});

async function open(protocol: "source" | "rust-web") {
  wrapper = mount(RconSettings, {
    props: {
      instanceId: "test",
      daemonId: "node",
      instanceInfo: {
        config: {
          rconProtocol: protocol,
          enableRcon: true,
          rconIp: "127.0.0.1",
          rconPort: 28016,
          rconPassword: "test-secret"
        }
      } as any
    },
    global: { stubs: { AModal: ModalStub } }
  });
  wrapper.vm.openDialog();
  await flushPromises();
}

async function selectProtocol(protocol: "source" | "rust-web") {
  wrapper.findComponent(Select).vm.$emit("change", protocol);
  await flushPromises();
}

async function setTarget(host: string, port: string, password: string) {
  const inputs = wrapper.findAll("input.ant-input");
  await inputs[0].setValue(host);
  await inputs[1].setValue(port);
  await inputs[2].setValue(password);
  await flushPromises();
}

async function submit() {
  wrapper.findComponent({ name: "AModal" }).vm.$emit("ok");
  await flushPromises();
}

describe("RCON settings permissions", () => {
  it("allows a WebRCON owner to reveal their password without modifying settings", async () => {
    await open("rust-web");
    expect(wrapper.findComponent({ name: "AModal" }).props("footer")).toBeNull();
    expect(wrapper.findComponent(Select).props("disabled")).toBe(true);
    expect(wrapper.findComponent(Switch).props("disabled")).toBe(true);
    const password = wrapper.findComponent(Input.Password);
    expect(password.props("readonly")).toBe(true);
    await password.find(".ant-input-password-icon").trigger("click");
    expect((password.find("input").element as HTMLInputElement).type).toBe("text");
    expect((password.find("input").element as HTMLInputElement).value).toBe("test-secret");
    expect(wrapper.text()).toContain("TXT_CODE_RCON_WEB_directAccessWarning");
    wrapper.findComponent({ name: "AModal" }).vm.$emit("ok");
    await flushPromises();
    expect(mocks.execute).not.toHaveBeenCalled();
  });

  it("keeps Source RCON editable for an owner", async () => {
    await open("source");
    expect(wrapper.findComponent(Select).props("disabled")).toBe(false);
    expect(wrapper.findComponent(Input.Password).props("readonly")).toBe(false);
    wrapper.findComponent({ name: "AModal" }).vm.$emit("ok");
    await flushPromises();
    expect(mocks.execute).toHaveBeenCalledTimes(1);
    expect(mocks.execute.mock.calls[0][0].data.rconProtocol).toBe("source");
  });

  it("preserves legacy Source RCON updates with incomplete settings", async () => {
    await open("source");
    await setTarget("", "", "");
    await submit();
    expect(mocks.execute.mock.calls[0][0].data).toEqual({
      rconProtocol: "source",
      rconIp: "",
      rconPort: 0,
      rconPassword: "",
      enableRcon: true
    });
  });

  it("allows an administrator to submit complete WebRCON settings", async () => {
    mocks.admin = true;
    await open("rust-web");
    expect(wrapper.findComponent(Select).props("disabled")).toBe(false);
    wrapper.findComponent({ name: "AModal" }).vm.$emit("ok");
    await flushPromises();
    expect(mocks.execute.mock.calls[0][0].data).toMatchObject({
      rconProtocol: "rust-web",
      rconIp: "127.0.0.1",
      rconPort: 28016,
      rconPassword: "test-secret"
    });
  });

  it("clears tenant-controlled Source connection details before switching to WebRCON", async () => {
    mocks.admin = true;
    await open("source");
    const originalConfig = { ...wrapper.props("instanceInfo").config };
    await selectProtocol("rust-web");
    expect(wrapper.findComponent(Select).props("value")).toBe("rust-web");
    expect(
      wrapper.findAll("input.ant-input").map((input) => (input.element as HTMLInputElement).value)
    ).toEqual(["", "", ""]);
    expect(wrapper.props("instanceInfo").config).toEqual(originalConfig);
    expect(wrapper.text()).toContain("TXT_CODE_RCON_WEB_reenterTarget");
    await submit();
    expect(mocks.execute).not.toHaveBeenCalled();
    expect(wrapper.findAll(".ant-form-item-explain-error").length).toBe(3);
    expect(mocks.reportError).not.toHaveBeenCalled();

    await setTarget("trusted.example", "28017", "new-secret");
    await submit();
    expect(mocks.execute).toHaveBeenCalledTimes(1);
    expect(mocks.execute.mock.calls[0][0].data).toEqual({
      rconProtocol: "rust-web",
      rconIp: "trusted.example",
      rconPort: 28017,
      rconPassword: "new-secret",
      enableRcon: true
    });
  });

  it.each([
    [" ", "28016", "secret"],
    ["localhost", "0", "secret"],
    ["localhost", "65536", "secret"],
    ["localhost", "1.5", "secret"],
    ["localhost", "not-a-port", "secret"],
    ["localhost", "28016", ""]
  ])("does not submit an invalid WebRCON target (%s, %s)", async (host, port, password) => {
    mocks.admin = true;
    await open("source");
    await selectProtocol("rust-web");
    await setTarget(host, port, password);
    await submit();
    expect(mocks.execute).not.toHaveBeenCalled();
    expect(wrapper.find(".ant-form-item-explain-error").exists()).toBe(true);
  });

  it("clears connection details again when switching back into WebRCON", async () => {
    mocks.admin = true;
    await open("rust-web");
    await selectProtocol("source");
    await selectProtocol("rust-web");
    expect(
      wrapper.findAll("input.ant-input").map((input) => (input.element as HTMLInputElement).value)
    ).toEqual(["", "", ""]);
    await submit();
    expect(mocks.execute).not.toHaveBeenCalled();
  });

  it("restores the saved settings after an unsubmitted protocol change", async () => {
    mocks.admin = true;
    await open("source");
    await selectProtocol("rust-web");
    wrapper.vm.openDialog();
    await flushPromises();
    expect(wrapper.findComponent(Select).props("value")).toBe("source");
    expect(
      wrapper.findAll("input.ant-input").map((input) => (input.element as HTMLInputElement).value)
    ).toEqual(["127.0.0.1", "28016", "test-secret"]);
    await submit();
    expect(mocks.execute.mock.calls[0][0].data.rconProtocol).toBe("source");
  });

  it("does not let an owner promote Source settings to WebRCON", async () => {
    await open("source");
    await selectProtocol("rust-web");
    expect(wrapper.findComponent(Select).props("value")).toBe("source");
  });

  it("does not replay protected RCON settings when an owner saves basic settings", async () => {
    wrapper = mount(InstanceFundamentalDetail, {
      props: {
        instanceId: "test",
        daemonId: "node",
        instanceInfo: {
          config: {
            type: "universal",
            nickname: "Rust server",
            processType: "docker",
            startCommand: "RustDedicated",
            updateCommand: "rust-update",
            fileCode: "utf-8",
            docker: { env: ["TEST=1"] },
            rconProtocol: "rust-web",
            rconIp: "127.0.0.1",
            rconPort: 28016,
            rconPassword: "test-secret",
            enableRcon: true
          }
        } as any
      },
      global: { stubs: { AModal: ModalStub } }
    });
    await wrapper.vm.openDialog();
    await flushPromises();
    wrapper.findComponent({ name: "AModal" }).vm.$emit("ok");
    await flushPromises();
    expect(mocks.execute).toHaveBeenCalledTimes(1);
    expect(mocks.execute.mock.calls[0][0].data).toEqual({
      processType: "docker",
      startCommand: "RustDedicated",
      updateCommand: "rust-update",
      fileCode: "utf-8",
      docker: { env: ["TEST=1"] }
    });
  });
});
