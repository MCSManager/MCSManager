import { beforeEach, describe, expect, it, vi } from "vitest";

// The panel itself is configured with TLS. Node connections must ignore this
// completely: the regression that started this test file was `connect()`
// rewriting `ws://` into `wss://` whenever the panel had `systemConfig.ssl` on.
vi.mock("../../setting", () => ({ systemConfig: { ssl: true } }));
vi.mock("../../service/log", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}));
vi.mock("../../i18n", () => ({
  $t: (key: string) => key,
  i18next: { language: "en_us", changeLanguage: vi.fn() }
}));
vi.mock("socket.io-client", () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    hasListeners: vi.fn(() => false),
    removeAllListeners: vi.fn(),
    disconnect: vi.fn(),
    close: vi.fn(),
    emit: vi.fn()
  }))
}));

import { io } from "socket.io-client";
import {
  buildRemoteServiceSocketUrl,
  RemoteServiceConfig,
  resolveRemoteServiceScheme
} from "../entity_interface";
import RemoteService from "../remote_service";
import { systemConfig } from "../../setting";

function makeConfig(ip: string, ssl?: boolean) {
  const config = new RemoteServiceConfig();
  config.ip = ip;
  config.port = 24444;
  config.ssl = ssl;
  return config;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("resolveRemoteServiceScheme", () => {
  it("lets an explicit ws:// scheme in ip win over ssl: true", () => {
    expect(resolveRemoteServiceScheme("ws://node.example.com", true)).toBe("ws");
  });

  it("lets an explicit wss:// scheme in ip win over ssl: false", () => {
    expect(resolveRemoteServiceScheme("wss://node.example.com", false)).toBe("wss");
  });

  it("maps explicit http:// and https:// schemes when present in ip", () => {
    expect(resolveRemoteServiceScheme("http://node.example.com")).toBe("ws");
    expect(resolveRemoteServiceScheme("HTTPS://node.example.com")).toBe("wss");
  });

  it("uses the node's ssl flag when ip carries no scheme", () => {
    expect(resolveRemoteServiceScheme("node.example.com", true)).toBe("wss");
    expect(resolveRemoteServiceScheme("node.example.com", false)).toBe("ws");
  });

  it("defaults to plain ws when ssl is absent", () => {
    expect(resolveRemoteServiceScheme("node.example.com")).toBe("ws");
    expect(resolveRemoteServiceScheme("node.example.com", undefined)).toBe("ws");
  });
});

describe("buildRemoteServiceSocketUrl", () => {
  it("keeps a scheme embedded in ip, as before", () => {
    expect(buildRemoteServiceSocketUrl("ws://node.example.com", 24444)).toBe(
      "ws://node.example.com:24444"
    );
    expect(buildRemoteServiceSocketUrl("wss://node.example.com", 24444)).toBe(
      "wss://node.example.com:24444"
    );
  });

  it("normalises http/https schemes into ws/wss", () => {
    expect(buildRemoteServiceSocketUrl("http://node.example.com", 24444)).toBe(
      "ws://node.example.com:24444"
    );
    expect(buildRemoteServiceSocketUrl("https://node.example.com", 24444)).toBe(
      "wss://node.example.com:24444"
    );
  });

  it("builds wss:// when the node is marked as TLS", () => {
    expect(buildRemoteServiceSocketUrl("node.example.com", 24444, true)).toBe(
      "wss://node.example.com:24444"
    );
  });

  it("builds ws:// when the node is not marked as TLS", () => {
    expect(buildRemoteServiceSocketUrl("node.example.com", 24444, false)).toBe(
      "ws://node.example.com:24444"
    );
  });

  it("builds ws:// for a legacy node without any ssl flag", () => {
    expect(buildRemoteServiceSocketUrl("node.example.com", 24444)).toBe(
      "ws://node.example.com:24444"
    );
  });

  it("does not change when the panel itself has systemConfig.ssl = true", () => {
    expect(systemConfig?.ssl).toBe(true);
    expect(buildRemoteServiceSocketUrl("node.example.com", 24444)).toBe(
      "ws://node.example.com:24444"
    );
    expect(buildRemoteServiceSocketUrl("node.example.com", 24444, undefined)).toBe(
      "ws://node.example.com:24444"
    );
  });
});

describe("RemoteService.connect", () => {
  it("dials a plain node with ws:// even when the panel uses TLS", () => {
    const service = new RemoteService("plain-node", makeConfig("127.0.0.1"));
    service.connect({ autoConnect: false, reconnection: false });
    expect(io).toHaveBeenLastCalledWith("ws://127.0.0.1:24444", expect.anything());
    expect(service.realUrl).toBe("ws://127.0.0.1:24444");
  });

  it("dials a TLS node with wss:// from the node's own ssl flag", () => {
    const service = new RemoteService("tls-node", makeConfig("127.0.0.1", true));
    service.connect({ autoConnect: false, reconnection: false });
    expect(io).toHaveBeenLastCalledWith("wss://127.0.0.1:24444", expect.anything());
    expect(service.realUrl).toBe("wss://127.0.0.1:24444");
  });

  it("honours an explicit wss:// scheme in ip for legacy configs without ssl", () => {
    const service = new RemoteService("legacy-tls", makeConfig("wss://node.example.com"));
    service.connect({ autoConnect: false, reconnection: false });
    expect(service.realUrl).toBe("wss://node.example.com:24444");
  });
});

describe("RemoteServiceConfig.addr", () => {
  it("keeps the legacy bare host:port form for plain nodes", () => {
    expect(makeConfig("node.example.com", false).addr).toBe("node.example.com:24444");
    expect(makeConfig("node.example.com").addr).toBe("node.example.com:24444");
  });

  it("keeps an explicit scheme in ip unchanged", () => {
    expect(makeConfig("ws://node.example.com").addr).toBe("ws://node.example.com:24444");
    expect(makeConfig("wss://node.example.com").addr).toBe("wss://node.example.com:24444");
  });

  it("gives a TLS node an explicit wss:// address for browser streams", () => {
    expect(makeConfig("node.example.com", true).addr).toBe("wss://node.example.com:24444");
  });
});
