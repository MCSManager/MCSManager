// @vitest-environment jsdom

import { mount } from "@vue/test-utils";
import type { Terminal } from "@xterm/xterm";
import { defineComponent, nextTick, ref } from "vue";
import { describe, expect, it, vi } from "vitest";
import { useAppConfigStore } from "@/stores/useAppConfigStore";
import { useTerminal, type UseTerminalHook } from "../useTerminal";

vi.mock("@/stores/useAppConfigStore", () => ({ useAppConfigStore: vi.fn() }));
vi.mock("@/hooks/useCommandHistory", () => ({
  useCommandHistory: () => ({ setHistory: vi.fn() })
}));
vi.mock("@/lang/i18n", () => ({ t: (key: string) => key }));
vi.mock("@/services/apis/instance", () => ({ setUpTerminalStreamChannel: vi.fn() }));
vi.mock("@/tools/copy", () => ({ toCopy: vi.fn() }));
vi.mock("@/tools/protocol", () => ({ mapDaemonAddress: vi.fn(), parseForwardAddress: vi.fn() }));
vi.mock("../useSocketIo", () => ({ makeSocketIo: vi.fn() }));
vi.mock("@xterm/addon-canvas", () => ({ CanvasAddon: vi.fn() }));
vi.mock("@xterm/addon-fit", () => ({ FitAddon: vi.fn() }));
vi.mock("@xterm/addon-unicode11", () => ({ Unicode11Addon: vi.fn() }));
vi.mock("@xterm/addon-webgl", () => ({ WebglAddon: vi.fn() }));
vi.mock("@xterm/xterm", () => ({ Terminal: vi.fn() }));

describe("terminal background", () => {
  it("updates an open terminal when the effective background changes and stops on unmount", async () => {
    const hasBgImage = ref(false);
    vi.mocked(useAppConfigStore).mockReturnValue({ hasBgImage } as ReturnType<
      typeof useAppConfigStore
    >);
    let hook!: UseTerminalHook;
    const wrapper = mount(
      defineComponent({
        setup() {
          hook = useTerminal();
          return () => null;
        }
      })
    );
    const theme = { background: "#1e1e1e", selectionBackground: "rgba(255, 255, 255, 0.3)" };
    const term = { options: { theme }, dispose: vi.fn() } as unknown as Terminal;
    hook.terminal.value = term;

    try {
      hasBgImage.value = true;
      await nextTick();
      expect(term.options.theme).toEqual({ ...theme, background: "#00000000" });

      hasBgImage.value = false;
      await nextTick();
      expect(term.options.theme).toEqual(theme);
    } finally {
      wrapper.unmount();
    }

    expect(term.dispose).toHaveBeenCalledOnce();
    hasBgImage.value = true;
    await nextTick();
    expect(term.options.theme).toEqual(theme);
  });
});
