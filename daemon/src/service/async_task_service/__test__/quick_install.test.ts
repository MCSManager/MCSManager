import { AxiosError, AxiosHeaders } from "axios";
import { once } from "events";
import fs from "fs-extra";
import { Agent, createServer } from "http";
import type { Socket } from "net";
import os from "os";
import path from "path";
import { PassThrough, Readable } from "stream";
import { format, inspect } from "util";
import { gzipSync } from "zlib";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type Instance from "../../../entity/instance/instance";
import { QuickInstallTask } from "../quick_install";

const mocks = vi.hoisted(() => ({
  info: vi.fn(),
  error: vi.fn(),
  readFile: vi.fn(),
  download: vi.fn()
}));
vi.mock("axios", async () => ({
  ...(await vi.importActual<typeof import("axios")>("axios")),
  default: mocks.download
}));
vi.mock("../../log", () => ({ default: { info: mocks.info, error: mocks.error } }));
vi.mock("../../file_router_service", () => ({
  getFileManager: () => ({
    readFile: mocks.readFile,
    toAbsolutePath: (file: string) => `/isolated-test/${file}`
  })
}));
vi.mock("../../../entity/instance/instance", () => ({
  default: class {
    static STATUS_BUSY = 1;
    static STATUS_STOP = 0;
  }
}));
vi.mock("../../../entity/instance/Instance_config", () => ({ default: class {} }));
vi.mock("../../system_instance", () => ({ default: { createInstance: vi.fn() } }));
vi.mock("../../instance_update_action", () => ({ InstanceUpdateAction: class {} }));
vi.mock("../../../i18n", () => ({ $t: (key: string) => key }));
vi.mock("i18next", () => ({ t: (key: string) => key }));

beforeEach(() => {
  mocks.info.mockReset();
  mocks.error.mockReset();
  mocks.readFile.mockReset();
  mocks.download.mockReset();
});
afterEach(() => {
  vi.restoreAllMocks();
});

const downloadUrl = "https://user:url-password@example.invalid/server.jar?token=download-secret";

function createDownloadInstance() {
  return {
    instanceUuid: "download-test",
    config: { nickname: "test server", processType: "general", updateCommand: "" },
    absoluteCwdPath: () => "/isolated-test",
    print: vi.fn(),
    println: vi.fn(),
    status: vi.fn(),
    resetConfigWithoutDocker: vi.fn(),
    parameters: vi.fn()
  };
}

async function expectSanitizedDownloadFailure(
  originalError: unknown,
  expectedMessage: string,
  url = downloadUrl
) {
  const instance = createDownloadInstance();
  const task = new QuickInstallTask("test server", url, undefined, instance as unknown as Instance);
  const onError = vi.fn();
  task.on("error", onError);
  const stopped = new Promise<void>((resolve) => task.once("stopped", resolve));
  await task.start();
  await expect(task.wait()).rejects.toThrow(expectedMessage);
  await stopped;

  expect(task.status()).toBe(-1);
  expect(instance.status).toHaveBeenLastCalledWith(0);
  expect(instance.parameters).not.toHaveBeenCalled();
  expect(instance.resetConfigWithoutDocker).not.toHaveBeenCalled();
  expect(task.errorInfo).not.toBe(originalError);
  expect(task.errorInfo?.message).toBe(expectedMessage);
  for (const property of ["config", "request", "response", "cause", "input"])
    expect(task.errorInfo).not.toHaveProperty(property);
  expect(mocks.error).toHaveBeenCalledTimes(1);
  expect(mocks.error).toHaveBeenCalledWith(expect.any(String), task.errorInfo);
  expect(instance.println).toHaveBeenCalledWith("ERROR", expectedMessage);
  expect(onError).toHaveBeenCalledWith(task.errorInfo);

  // Match logger formatting as well as deep Error inspection, not just enumerable JSON fields.
  const output = [
    ...mocks.error.mock.calls.map((args) => format(...args)),
    inspect(
      {
        taskError: task.errorInfo,
        info: mocks.info.mock.calls,
        console: { print: instance.print.mock.calls, println: instance.println.mock.calls },
        events: onError.mock.calls
      },
      { depth: null }
    )
  ].join("\n");
  for (const secret of [
    url,
    "url-password",
    "download-secret",
    "header-secret",
    "response-secret",
    "cause-secret"
  ])
    expect(output).not.toContain(secret);
}

describe("quick install download error sanitization", () => {
  it.each([
    { name: "DNS failure", code: "ENOTFOUND", status: undefined, details: "ENOTFOUND" },
    {
      name: "HTTP 401",
      code: "ERR_BAD_REQUEST",
      status: 401,
      details: "HTTP 401, ERR_BAD_REQUEST"
    },
    {
      name: "HTTP 403",
      code: "ERR_BAD_REQUEST",
      status: 403,
      details: "HTTP 403, ERR_BAD_REQUEST"
    },
    {
      name: "TLS failure",
      code: "ERR_TLS_CERT_ALTNAME_INVALID",
      status: undefined,
      details: "ERR_TLS_CERT_ALTNAME_INVALID"
    },
    {
      name: "redirect failure",
      code: "ERR_FR_TOO_MANY_REDIRECTS",
      status: undefined,
      details: "ERR_FR_TOO_MANY_REDIRECTS"
    },
    { name: "timeout", code: "ETIMEDOUT", status: undefined, details: "ETIMEDOUT" },
    { name: "cancellation", code: "ERR_CANCELED", status: undefined, details: "ERR_CANCELED" },
    {
      name: "untrusted code and status",
      code: "download-secret",
      status: "url-password",
      details: ""
    },
    {
      name: "out of range status",
      code: "ERR_BAD_RESPONSE",
      status: 600,
      details: "ERR_BAD_RESPONSE"
    },
    {
      name: "fractional status",
      code: "ERR_BAD_RESPONSE",
      status: 401.5,
      details: "ERR_BAD_RESPONSE"
    }
  ])("sanitizes $name without losing safe diagnostics", async ({ code, status, details }) => {
    const config = {
      url: downloadUrl,
      headers: new AxiosHeaders({ Authorization: "Bearer header-secret" })
    };
    const request = { url: downloadUrl };
    const response =
      status === undefined
        ? undefined
        : {
            data: "response-secret",
            status: status as number,
            statusText: "response-secret",
            headers: { secret: "header-secret" },
            config,
            request
          };
    const error = new AxiosError(`Request failed: ${downloadUrl}`, code, config, request, response);
    Object.assign(error, { cause: new Error(`cause-secret: ${downloadUrl}`) });
    const createWriteStream = vi.spyOn(fs, "createWriteStream").mockImplementation(() => {
      throw new Error("Unexpected destination file creation");
    });
    mocks.download.mockRejectedValue(error);

    await expectSanitizedDownloadFailure(
      error,
      `TXT_CODE_9ea5696b${details ? ` (${details})` : ""}`
    );
    expect(mocks.download).toHaveBeenCalledTimes(1);
    expect(createWriteStream).not.toHaveBeenCalled();
  });

  it.each([401, 403, 500])(
    "destroys an HTTP %i response body without consuming it",
    async (status) => {
      const body = new PassThrough();
      body.write("response-secret");
      const read = vi.spyOn(body, "read");
      const config = { url: downloadUrl, headers: new AxiosHeaders() };
      const code = status < 500 ? "ERR_BAD_REQUEST" : "ERR_BAD_RESPONSE";
      const error = new AxiosError(`Request failed: ${downloadUrl}`, code, config, undefined, {
        data: body,
        status,
        statusText: "response-secret",
        headers: {},
        config
      });
      const createWriteStream = vi.spyOn(fs, "createWriteStream").mockImplementation(() => {
        throw new Error("Unexpected destination file creation");
      });
      mocks.download.mockRejectedValue(error);

      try {
        await expectSanitizedDownloadFailure(error, `TXT_CODE_9ea5696b (HTTP ${status}, ${code})`);
        expect(body.destroyed).toBe(true);
        expect(read).not.toHaveBeenCalled();
        expect(createWriteStream).not.toHaveBeenCalled();
      } finally {
        body.destroy();
      }
    }
  );

  it.each(["plain", "gzip"])("closes a pending %s HTTP 403 connection", async (encoding) => {
    const { default: axios } = await vi.importActual<typeof import("axios")>("axios");
    const agent = new Agent({ keepAlive: false });
    const sockets = new Set<Socket>();
    let responseBody: Readable | undefined;
    const server = createServer((_, response) => {
      response.writeHead(403, {
        "Content-Type": "application/octet-stream",
        ...(encoding === "gzip" ? { "Content-Encoding": "gzip" } : {})
      });
      const content = Buffer.from("response-secret");
      response.write(encoding === "gzip" ? gzipSync(content) : content);
      // Keep the response pending so only client-side cleanup can close the connection.
    });
    const connectionClosed = new Promise<void>((resolve) => {
      server.once("connection", (socket) => {
        sockets.add(socket);
        socket.once("close", () => {
          sockets.delete(socket);
          resolve();
        });
      });
    });
    const createWriteStream = vi.spyOn(fs, "createWriteStream").mockImplementation(() => {
      throw new Error("Unexpected destination file creation");
    });

    try {
      const listening = once(server, "listening");
      server.listen(0, "127.0.0.1");
      await listening;
      const address = server.address();
      if (!address || typeof address === "string") throw new Error("Missing test server address");
      const url = `http://user:url-password@127.0.0.1:${address.port}/server.jar?token=download-secret`;
      mocks.download.mockImplementation(async (config) => {
        try {
          return await axios({ ...config, httpAgent: agent, proxy: false });
        } catch (error) {
          if (error instanceof AxiosError) responseBody = error.response?.data;
          throw error;
        }
      });

      await expectSanitizedDownloadFailure(
        undefined,
        "TXT_CODE_9ea5696b (HTTP 403, ERR_BAD_REQUEST)",
        url
      );
      expect(responseBody).toBeInstanceOf(Readable);
      expect(responseBody?.destroyed).toBe(true);
      await connectionClosed;
      expect(sockets.size).toBe(0);
      expect(mocks.download).toHaveBeenCalledTimes(1);
      expect(createWriteStream).not.toHaveBeenCalled();
    } finally {
      responseBody?.destroy();
      agent.destroy();
      for (const socket of sockets) socket.destroy();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it("handles destination errors even when the HTTP response is delayed", async () => {
    const error = Object.assign(new Error(`Write failed: ${downloadUrl}`), {
      cause: new Error("cause-secret")
    });
    const source = Readable.from([Buffer.from("downloaded content")]);
    const destination = new PassThrough();
    vi.spyOn(fs, "createWriteStream").mockImplementation(() => {
      queueMicrotask(() => destination.destroy(error));
      return destination as unknown as fs.WriteStream;
    });
    mocks.download.mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return { data: source, headers: {} };
    });

    await expectSanitizedDownloadFailure(error, "TXT_CODE_9ea5696b");
    expect(mocks.download).toHaveBeenCalledTimes(1);
    expect(source.destroyed).toBe(true);
    expect(destination.destroyed).toBe(true);
  });

  it("releases the response stream if opening the destination throws", async () => {
    const error = Object.assign(new Error(`Cannot open destination: ${downloadUrl}`), {
      cause: new Error("cause-secret")
    });
    const source = new PassThrough();
    mocks.download.mockResolvedValue({ data: source, headers: {} });
    vi.spyOn(fs, "createWriteStream").mockImplementation(() => {
      throw error;
    });

    await expectSanitizedDownloadFailure(error, "TXT_CODE_9ea5696b");
    expect(mocks.download).toHaveBeenCalledTimes(1);
    expect(source.destroyed).toBe(true);
  });

  it("sanitizes errors emitted by the response stream", async () => {
    const error = Object.assign(new Error(`Connection lost: ${downloadUrl}`), {
      config: { url: downloadUrl },
      cause: new Error("cause-secret")
    });
    const source = new Readable({
      read() {
        this.destroy(error);
      }
    });
    const destination = new PassThrough();
    vi.spyOn(fs, "createWriteStream").mockReturnValue(destination as unknown as fs.WriteStream);
    mocks.download.mockResolvedValue({ data: source, headers: {} });

    await expectSanitizedDownloadFailure(error, "TXT_CODE_9ea5696b");
    expect(mocks.download).toHaveBeenCalledTimes(1);
    expect(source.destroyed).toBe(true);
    expect(destination.destroyed).toBe(true);
  });

  it("sanitizes URL parsing errors before a request is sent", async () => {
    const invalidUrl = "https://user:url-password@[invalid]/server.jar?token=download-secret";
    await expectSanitizedDownloadFailure(undefined, "TXT_CODE_9ea5696b", invalidUrl);
    expect(mocks.download).not.toHaveBeenCalled();
  });
});

describe("quick install config logging", () => {
  it("does not print a credential-bearing download URL after a successful download", async () => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), "mcsm-quick-install-log-"));
    const url = "https://user:url-password@example.invalid/server.jar?token=download-secret";
    const instance = {
      instanceUuid: "download-test",
      config: { nickname: "test server", processType: "general", updateCommand: "" },
      absoluteCwdPath: () => directory,
      print: vi.fn(),
      println: vi.fn(),
      status: vi.fn(),
      resetConfigWithoutDocker: vi.fn(),
      parameters: vi.fn()
    };
    mocks.download.mockResolvedValue({
      data: Readable.from([Buffer.from("downloaded content")]),
      headers: { "content-length": "18" }
    });
    try {
      const task = new QuickInstallTask(
        "test server",
        url,
        undefined,
        instance as unknown as Instance
      );
      await task.start();
      await task.wait();
      expect(mocks.download).toHaveBeenCalledWith(expect.objectContaining({ url }));
      expect(await fs.readFile(path.join(directory, "server.jar"), "utf8")).toBe(
        "downloaded content"
      );
      expect(instance.println).toHaveBeenCalledWith("INFO", "TXT_CODE_b135e9bd 100%");
      const output = JSON.stringify([
        ...instance.print.mock.calls,
        ...instance.println.mock.calls,
        ...mocks.info.mock.calls,
        ...mocks.error.mock.calls
      ]);
      for (const secret of [url, "url-password", "download-secret"])
        expect(output).not.toContain(secret);
      expect(mocks.error).not.toHaveBeenCalled();
    } finally {
      await fs.remove(directory);
    }
  });

  it.each(["build parameters", "archive preset"])(
    "applies %s without logging passwords, environment values or commands",
    async (source) => {
      const config = {
        startCommand: "server --token command-secret",
        rconPassword: "rcon-secret",
        docker: { env: ["TOKEN=environment-secret"] }
      };
      const instance = {
        instanceUuid: "test-instance",
        config: { nickname: "test server", processType: "general", updateCommand: "" },
        print: vi.fn(),
        println: vi.fn(),
        status: vi.fn(),
        resetConfigWithoutDocker: vi.fn(),
        parameters: vi.fn()
      };
      const usePreset = source === "archive preset";
      vi.spyOn(fs, "existsSync").mockImplementation(
        (file) => usePreset && file === "mcsmanager-config.json"
      );
      mocks.readFile.mockResolvedValue(JSON.stringify(config));
      const task = new QuickInstallTask(
        "test server",
        undefined,
        usePreset ? undefined : (config as IGlobalInstanceConfig),
        instance as unknown as Instance
      );
      await task.start();
      await task.wait();

      expect(instance.parameters).toHaveBeenCalledWith(config, true);
      expect(instance.resetConfigWithoutDocker).toHaveBeenCalledTimes(1);
      expect(mocks.readFile).toHaveBeenCalledTimes(usePreset ? 1 : 0);
      expect(mocks.info).toHaveBeenCalledWith("TXT_CODE_e5ba712d", "test server", "test-instance");
      const logs = JSON.stringify([...mocks.info.mock.calls, ...mocks.error.mock.calls]);
      for (const secret of ["rcon-secret", "environment-secret", "command-secret"])
        expect(logs).not.toContain(secret);
      expect(mocks.error).not.toHaveBeenCalled();
    }
  );
});
