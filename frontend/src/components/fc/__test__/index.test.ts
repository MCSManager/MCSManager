// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { openInstanceReinstallDialog, openMarketDialog } from "@/components/fc";

const mocks = vi.hoisted(() => ({
  useMountComponent: vi.fn(),
  load: vi.fn(),
  openDialog: vi.fn()
}));

vi.mock("@/hooks/useMountComponent", () => ({
  useMountComponent: mocks.useMountComponent
}));

vi.mock("@/widgets/instance/dialogs/InstanceReinstallDialog.vue", () => ({
  default: { name: "InstanceReinstallDialog" }
}));

vi.mock("@/widgets/market/MarketDialog.vue", () => ({
  default: { name: "MarketDialog" }
}));

vi.mock("@xterm/addon-canvas", () => ({ CanvasAddon: vi.fn() }));
vi.mock("@xterm/addon-webgl", () => ({ WebglAddon: vi.fn() }));
vi.mock("@xterm/xterm", () => ({ Terminal: vi.fn() }));

describe("fc market dialogs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useMountComponent.mockReturnValue({ load: mocks.load });
    mocks.load.mockReturnValue({ openDialog: mocks.openDialog });
    mocks.openDialog.mockResolvedValue(undefined);
  });

  it("opens the instance reinstall dialog with instance context", async () => {
    await openInstanceReinstallDialog("daemon-1", "instance-1", {
      autoInstall: true,
      onlyDockerTemplate: true
    });

    expect(mocks.useMountComponent).toHaveBeenCalledWith({
      daemonId: "daemon-1",
      instanceId: "instance-1",
      autoInstall: true,
      onlyDockerTemplate: true
    });
    expect(mocks.load).toHaveBeenCalledTimes(1);
    expect(mocks.openDialog).toHaveBeenCalledTimes(1);
  });

  it("opens the full application market without instance context", async () => {
    await openMarketDialog();

    expect(mocks.useMountComponent.mock.calls[0]).toEqual([]);
    expect(mocks.load).toHaveBeenCalledTimes(1);
    expect(mocks.openDialog).toHaveBeenCalledTimes(1);
  });
});
