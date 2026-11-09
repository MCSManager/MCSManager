// @vitest-environment jsdom

import { flushPromises } from "@vue/test-utils";
import { beforeEach, expect, it, vi } from "vitest";
import { ref } from "vue";
import { useModSearch } from "../useModSearch";

const mocks = vi.hoisted(() => ({ download: vi.fn(), remove: vi.fn() }));
vi.mock("@/lang/i18n", () => ({ t: (key: string) => key }));
vi.mock("ant-design-vue", () => ({
  Button: {},
  Modal: {},
  message: { success: vi.fn(), error: vi.fn() }
}));
vi.mock("@ant-design/icons-vue", () => ({ ExclamationCircleOutlined: {} }));
vi.mock("@/services/apis/modManager", () => ({
  downloadModApi: () => ({ execute: mocks.download }),
  deleteModApi: () => ({ execute: mocks.remove })
}));
beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

it("passes the installed version to the daemon without deleting it on acceptance", async () => {
  const search = useModSearch(
    "instance",
    "daemon",
    () => [
      {
        file: "old.jar",
        path: "mods/old.jar",
        folder: "mods",
        extraInfo: { project: { id: "project" } }
      }
    ],
    vi.fn(),
    ref(["mods"])
  );
  search.selectedMod.value = { id: "project", title: "Example" };
  const task = await search.onDownload({
    id: "version",
    files: [{ url: "https://example.com/new.jar", filename: "new.jar", primary: true }]
  });
  await task!.immediateFn();
  await flushPromises();
  expect(mocks.download.mock.calls[0][0].data.oldFileName).toBe("mods/old.jar");
  expect(mocks.remove).not.toHaveBeenCalled();
});

it("does not replace an installed version from a different destination", async () => {
  const search = useModSearch(
    "instance",
    "daemon",
    () => [
      {
        file: "old.jar",
        folder: "plugins",
        extraInfo: { project: { id: "project" } }
      }
    ],
    vi.fn(),
    ref(["mods"])
  );
  search.selectedMod.value = { id: "project" };
  const task = await search.onDownload({
    files: [{ url: "https://example.com/new.jar", filename: "new.jar" }]
  });
  await task!.immediateFn();
  expect(mocks.download.mock.calls[0][0].data.oldFileName).toBeUndefined();
});
