// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  init: vi.fn(),
  piece: vi.fn(),
  report: vi.fn(),
  success: vi.fn(),
  error: vi.fn()
}));
vi.mock("@/lang/i18n", () => ({ t: (key: string) => key }));
vi.mock("@/tools/validator", () => ({ reportErrorMsg: mocks.report }));
vi.mock("ant-design-vue", () => ({ message: { success: mocks.success, error: mocks.error } }));
vi.mock("@/services/apis/fileManager", async () => {
  const { ref } = await import("vue");
  return {
    uploadFile: () => {
      const state = ref();
      return {
        state,
        execute: async (options: any) => {
          state.value = await mocks.init(options);
        }
      };
    },
    uploadFilePiece: () => ({ execute: mocks.piece })
  };
});

import uploadService from "../uploadService";
import { flushPromises } from "@vue/test-utils";

function deferred() {
  let resolve!: (value: any) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
function append(name: string) {
  const end = vi.fn();
  uploadService.append(
    new File(["content"], name),
    "http://daemon",
    "token",
    { overwrite: true },
    (file) => file.addCallback("end", end)
  );
  return end;
}
beforeEach(() => {
  vi.clearAllMocks();
  uploadService.uploaded = 0;
  let id = 0;
  vi.spyOn(Date, "now").mockImplementation(() => ++id);
  mocks.init.mockImplementation(async ({ params }) => ({ id: params.filename, received: [] }));
  mocks.piece.mockResolvedValue(undefined);
});
afterEach(async () => {
  await uploadService.stop();
  vi.restoreAllMocks();
});

describe("upload initialization failures", () => {
  it("continues with the next file after the current initialization fails", async () => {
    const first = deferred();
    mocks.init.mockImplementation(async ({ params }) =>
      params.filename === "first" ? first.promise : { id: "next", received: [] }
    );
    const firstEnd = append("first");
    const nextEnd = append("next");
    await flushPromises();
    first.reject(new Error("initialization failed"));
    await flushPromises();
    expect(mocks.piece).toHaveBeenCalledTimes(1);
    expect(firstEnd).toHaveBeenCalledTimes(1);
    expect(nextEnd).toHaveBeenCalledTimes(1);
    expect(uploadService.uploaded).toBe(1);
    expect(uploadService.files.size).toBe(0);
    expect(uploadService.status).toBe("stopped");
  });

  it("ends a failed queued file once without counting it as uploaded", async () => {
    const piece = deferred();
    mocks.piece.mockReturnValueOnce(piece.promise).mockResolvedValue(undefined);
    mocks.init.mockImplementation(async ({ params }) => {
      if (params.filename === "failed") throw new Error("initialization failed");
      return { id: params.filename, received: [] };
    });
    const firstEnd = append("first");
    const failedEnd = append("failed");
    const lastEnd = append("last");
    await flushPromises();
    piece.resolve(undefined);
    await flushPromises();
    expect(firstEnd).toHaveBeenCalledTimes(1);
    expect(failedEnd).toHaveBeenCalledTimes(1);
    expect(lastEnd).toHaveBeenCalledTimes(1);
    expect(uploadService.uploaded).toBe(2);
    expect(mocks.success).toHaveBeenCalledTimes(2);
    expect(uploadService.status).toBe("stopped");
  });

  it("stops cleanly when every file fails to initialize", async () => {
    mocks.init.mockRejectedValue(new Error("initialization failed"));
    const firstEnd = append("first");
    const nextEnd = append("next");
    await flushPromises();
    expect(firstEnd).toHaveBeenCalledTimes(1);
    expect(nextEnd).toHaveBeenCalledTimes(1);
    expect(uploadService.status).toBe("stopped");
    expect(uploadService.current).toBeUndefined();
    expect(uploadService.files.size).toBe(0);
    expect(uploadService.uploaded).toBe(0);
    expect(mocks.success).not.toHaveBeenCalled();
  });

  it("does not restart a canceled upload when its initialization later fails", async () => {
    const init = deferred();
    mocks.init.mockReturnValue(init.promise);
    const end = append("canceled");
    await uploadService.stop();
    init.reject(new Error("initialization failed"));
    await flushPromises();
    expect(end).toHaveBeenCalledTimes(1);
    expect(uploadService.status).toBe("stopped");
    expect(mocks.piece).not.toHaveBeenCalled();
  });
});
