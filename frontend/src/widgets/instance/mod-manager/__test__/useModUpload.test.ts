// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import { TAB_KEY_DOWNLOAD, TAB_KEY_MODS, TAB_KEY_PLUGINS } from "../tabs";
import { useModUpload } from "../useModUpload";

const mocks = vi.hoisted(() => ({
  selectedFiles: vi.fn(),
  confirm: vi.fn(),
  warning: vi.fn()
}));

vi.mock("@/hooks/useFileManager", () => ({
  useFileManager: () => ({ selectedFiles: mocks.selectedFiles })
}));

vi.mock("@/lang/i18n", () => ({ t: (key: string) => key }));
vi.mock("ant-design-vue", () => ({
  Modal: { confirm: mocks.confirm },
  message: { warning: mocks.warning }
}));
vi.mock("@ant-design/icons-vue", () => ({ ExclamationCircleOutlined: {} }));

const file = new File(["jar content"], "example.jar");

function fileChange(files: File[] = [file]) {
  return { target: { files } } as unknown as Event;
}

function dragEvent(files: File[] = [file]) {
  return {
    preventDefault: vi.fn(),
    dataTransfer: { files, dropEffect: "none" }
  } as unknown as DragEvent;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.selectedFiles.mockResolvedValue(undefined);
});

describe("mod manager uploads", () => {
  it.each([
    [TAB_KEY_MODS, "mods"],
    [TAB_KEY_PLUGINS, "plugins"]
  ])("uploads selected files from %s into %s", async (tab, directory) => {
    const upload = useModUpload("instance", "daemon", ref(tab), vi.fn());
    await upload.onFileChange(fileChange());

    expect(mocks.selectedFiles).toHaveBeenCalledWith([file], directory, expect.any(Function));
  });

  it.each([
    [TAB_KEY_MODS, "mods"],
    [TAB_KEY_PLUGINS, "plugins"]
  ])("uploads dropped files from %s into %s after confirmation", async (tab, directory) => {
    const upload = useModUpload("instance", "daemon", ref(tab), vi.fn());
    upload.handleDrop(dragEvent());

    expect(mocks.confirm).toHaveBeenCalledTimes(1);
    expect(mocks.selectedFiles).not.toHaveBeenCalled();
    await mocks.confirm.mock.calls[0][0].onOk();
    expect(mocks.selectedFiles).toHaveBeenCalledWith([file], directory, expect.any(Function));
  });

  it("shows the drop overlay on the mods tab", () => {
    const upload = useModUpload("instance", "daemon", ref(TAB_KEY_MODS), vi.fn());
    const event = dragEvent();
    upload.handleDragover(event);

    expect(upload.opacity.value).toBe(true);
    expect(event.dataTransfer?.dropEffect).toBe("copy");
  });

  it("does not show the drop overlay on the download tab", () => {
    const upload = useModUpload("instance", "daemon", ref(TAB_KEY_DOWNLOAD), vi.fn());
    upload.handleDragover(dragEvent());

    expect(upload.opacity.value).toBe(false);
  });

  it("ignores files dropped on the download tab", () => {
    const activeTab = ref(TAB_KEY_MODS);
    const upload = useModUpload("instance", "daemon", activeTab, vi.fn());
    upload.handleDragover(dragEvent());
    activeTab.value = TAB_KEY_DOWNLOAD;
    upload.handleDrop(dragEvent());

    expect(upload.opacity.value).toBe(false);
    expect(mocks.confirm).not.toHaveBeenCalled();
    expect(mocks.selectedFiles).not.toHaveBeenCalled();
  });

  it("ignores an empty file selection", async () => {
    const upload = useModUpload("instance", "daemon", ref(TAB_KEY_MODS), vi.fn());
    await upload.onFileChange(fileChange([]));

    expect(mocks.selectedFiles).not.toHaveBeenCalled();
  });

  it("ignores an empty drop", () => {
    const upload = useModUpload("instance", "daemon", ref(TAB_KEY_MODS), vi.fn());
    upload.handleDrop(dragEvent([]));

    expect(mocks.confirm).not.toHaveBeenCalled();
    expect(mocks.selectedFiles).not.toHaveBeenCalled();
  });

  it("refreshes the list after the upload completes", async () => {
    const loadMods = vi.fn();
    const upload = useModUpload("instance", "daemon", ref(TAB_KEY_MODS), loadMods);
    await upload.onFileChange(fileChange());

    expect(loadMods).not.toHaveBeenCalled();
    await mocks.selectedFiles.mock.calls[0][2]();
    expect(loadMods).toHaveBeenCalledTimes(1);
  });
});
