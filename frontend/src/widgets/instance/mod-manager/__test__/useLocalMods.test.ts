// @vitest-environment jsdom

import { flushPromises, mount } from "@vue/test-utils";
import { defineComponent } from "vue";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useLocalMods } from "../useLocalMods";

const mocks = vi.hoisted(() => ({ toggle: vi.fn(), remove: vi.fn() }));
vi.mock("@/lang/i18n", () => ({ t: (key: string) => key }));
vi.mock("ant-design-vue", () => ({ message: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/services/apis/modManager", () => ({
  toggleModApi: () => ({ execute: mocks.toggle }),
  deleteModApi: () => ({ execute: mocks.remove })
}));

let local: ReturnType<typeof useLocalMods>;
let wrapper: ReturnType<typeof mount>;
beforeEach(() => {
  vi.clearAllMocks();
  wrapper = mount(
    defineComponent({
      setup() {
        local = useLocalMods("instance", "daemon");
        return () => null;
      }
    })
  );
});
afterEach(() => wrapper.unmount());

it("deletes only the selected row when names match in different folders", async () => {
  local.mods.value = [
    { file: "shared.jar", path: "mods/shared.jar" },
    { file: "shared.jar", path: "plugins/shared.jar" }
  ];
  await local.onDelete(local.mods.value[1]);
  await flushPromises();
  expect(mocks.remove).toHaveBeenCalledWith({
    data: {
      uuid: "instance",
      daemonId: "daemon",
      fileName: "plugins/shared.jar"
    }
  });
  expect(local.mods.value.map((mod) => mod.path)).toEqual(["mods/shared.jar"]);
});

it("updates the relative path after toggling so the next operation uses the renamed file", async () => {
  const plugin = { file: "shared.jar", path: "Plugins/shared.jar", enabled: true };
  await local.onToggle(plugin);
  await flushPromises();
  expect(plugin.path).toBe("Plugins/shared.jar.disabled");
  await local.onToggle(plugin);
  await flushPromises();
  expect(mocks.toggle.mock.calls[1][0].data.fileName).toBe("Plugins/shared.jar.disabled");
  expect(plugin.path).toBe("Plugins/shared.jar");
});

it("uses the filename when an older daemon omits the path", async () => {
  await local.onDelete({ file: "legacy.jar" });
  await flushPromises();
  expect(mocks.remove.mock.calls[0][0].data.fileName).toBe("legacy.jar");
});
