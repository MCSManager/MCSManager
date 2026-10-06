import { createHash } from "crypto";
import { createServer } from "http";
import { AddressInfo } from "net";
import { Duplex } from "stream";
import { afterEach, describe, expect, it, vi } from "vitest";
import WebSocket, { WebSocketServer } from "ws";
import { executeWebRcon, WebRconError } from "../web_rcon_client";
import WebRconCommand from "../web_rcon_command";
import type Instance from "../../../instance/instance";

let server: WebSocketServer | undefined;

async function listen(options: ConstructorParameters<typeof WebSocketServer>[0] = {}) {
  server = new WebSocketServer({ host: "127.0.0.1", port: 0, ...options });
  await new Promise<void>((resolve) => server!.once("listening", resolve));
  return (server.address() as AddressInfo).port;
}

afterEach(async () => {
  if (!server) return;
  for (const client of server.clients) client.terminate();
  await new Promise<void>((resolve) => server!.close(() => resolve()));
  server = undefined;
});

describe("Rust WebRCON client", () => {
  it("sends the Rust command packet and returns only the matching reply", async () => {
    const port = await listen();
    let path = "";
    let requests = 0;
    server!.on("connection", (socket, request) => {
      path = request.url || "";
      socket.on("message", (raw) => {
        requests++;
        const packet = JSON.parse(raw.toString());
        expect(packet).toEqual({
          Identifier: 1001,
          Message: "gather.rate dispenser * 2",
          Name: "WebRcon"
        });
        socket.send(JSON.stringify({ Identifier: 0, Message: "log message" }));
        socket.send(JSON.stringify({ Identifier: 1001, Message: "rate updated" }));
      });
    });

    const result = await executeWebRcon({
      host: "127.0.0.1",
      port,
      password: "test-secret",
      command: "gather.rate dispenser * 2"
    });
    expect(result).toBe("rate updated");
    expect(path).toBe("/test-secret");
    expect(requests).toBe(1);
  });

  it("encodes special characters in the password path", async () => {
    const port = await listen();
    let path = "";
    server!.on("connection", (socket, request) => {
      path = request.url || "";
      socket.on("message", () => socket.send(JSON.stringify({ Identifier: 1001, Message: "ok" })));
    });
    await executeWebRcon({ host: "127.0.0.1", port, password: "p/a#b", command: "status" });
    expect(path).toBe("/p%2Fa%23b");
  });

  it("releases the connection when a server does not acknowledge WebSocket close", async () => {
    let client: Duplex | undefined;
    const rawServer = createServer();
    rawServer.on("upgrade", (request, socket, head) => {
      client = socket;
      socket.on("end", () => socket.destroy());
      const key = request.headers["sec-websocket-key"];
      if (typeof key !== "string") return socket.destroy();
      const accept = createHash("sha1")
        .update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`)
        .digest("base64");
      socket.write(
        `HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${accept}\r\n\r\n`
      );
      const reply = () => {
        const response = Buffer.from(JSON.stringify({ Identifier: 1001, Message: "ok" }));
        socket.write(Buffer.concat([Buffer.from([0x81, response.length]), response]));
        // A raw TCP peer never sends a WebSocket close response.
      };
      let replied = false;
      socket.on("data", () => {
        if (replied) return;
        replied = true;
        reply();
      });
      if (head.length) {
        replied = true;
        reply();
      }
    });
    await new Promise<void>((resolve) => rawServer.listen(0, "127.0.0.1", resolve));
    try {
      const port = (rawServer.address() as AddressInfo).port;
      expect(
        await executeWebRcon({ host: "127.0.0.1", port, password: "secret", command: "status" })
      ).toBe("ok");
      for (let i = 0; i < 20 && !client?.destroyed; i++)
        await new Promise((resolve) => setTimeout(resolve, 25));
      expect(client?.destroyed).toBe(true);
    } finally {
      client?.destroy();
      await new Promise<void>((resolve) => rawServer.close(() => resolve()));
    }
  });

  it("rejects malformed replies", async () => {
    const port = await listen();
    server!.on("connection", (socket) => socket.on("message", () => socket.send("not json")));
    await expect(
      executeWebRcon({ host: "127.0.0.1", port, password: "secret", command: "status" })
    ).rejects.toMatchObject({ code: "invalidResponse" });
  });

  it("times out without retrying a command that may already have run", async () => {
    const port = await listen();
    let requests = 0;
    server!.on("connection", (socket) => socket.on("message", () => requests++));
    await expect(
      executeWebRcon({
        host: "127.0.0.1",
        port,
        password: "secret",
        command: "gather.rate dispenser * 2",
        responseTimeoutMs: 40
      })
    ).rejects.toMatchObject({ code: "timeout", writeConfirmed: true });
    expect(requests).toBe(1);
  });

  it("reports a close after sending without leaking the password", async () => {
    const port = await listen();
    server!.on("connection", (socket) => socket.on("message", () => socket.close()));
    const error = await executeWebRcon({
      host: "127.0.0.1",
      port,
      password: "secret",
      command: "quit"
    }).catch((reason) => reason as WebRconError);
    expect(error).toMatchObject({ code: "closed", writeConfirmed: true });
    expect(error.message).not.toContain("secret");
  });

  it("does not hide a failed send while an instance is stopping", async () => {
    const port = await listen();
    const send = vi.spyOn(WebSocket.prototype, "send").mockImplementation((...args) => {
      const callback = args[args.length - 1];
      if (typeof callback === "function") callback(new Error("write failed"));
    });
    try {
      await expect(
        executeWebRcon({ host: "127.0.0.1", port, password: "secret", command: "quit" })
      ).rejects.toMatchObject({ code: "sendFailed", writeConfirmed: false });

      const println = vi.fn();
      const instance = {
        config: { rconIp: "127.0.0.1", rconPort: port, rconPassword: "secret" },
        process: {},
        print: vi.fn(),
        println,
        status: () => 1
      } as unknown as Instance;
      await new WebRconCommand().exec(instance, "quit");
      expect(println).toHaveBeenCalledWith("RCON ERROR", expect.any(String));
    } finally {
      send.mockRestore();
    }
  });

  it("handles a synchronous send failure without leaving a connection open", async () => {
    const port = await listen();
    const send = vi.spyOn(WebSocket.prototype, "send").mockImplementation(() => {
      throw new Error("write failed");
    });
    try {
      await expect(
        executeWebRcon({ host: "127.0.0.1", port, password: "secret", command: "quit" })
      ).rejects.toMatchObject({ code: "sendFailed", writeConfirmed: false });
    } finally {
      send.mockRestore();
    }
  });

  it("does not hide socket errors after a confirmed write during shutdown", async () => {
    const port = await listen();
    const send = vi.spyOn(WebSocket.prototype, "send").mockImplementation(function (
      this: WebSocket,
      ...args
    ) {
      const callback = args[args.length - 1];
      if (typeof callback === "function") callback();
      this.emit("error", new Error("connection failed"));
    });
    try {
      const println = vi.fn();
      const instance = {
        config: { rconIp: "127.0.0.1", rconPort: port, rconPassword: "secret" },
        process: {},
        print: vi.fn(),
        println,
        status: () => 1
      } as unknown as Instance;
      await new WebRconCommand().exec(instance, "quit");
      expect(println).toHaveBeenCalledWith("RCON ERROR", expect.any(String));
    } finally {
      send.mockRestore();
    }
  });

  it("rejects a failed handshake without exposing the password", async () => {
    const port = await listen({ verifyClient: () => false });
    const error = await executeWebRcon({
      host: "127.0.0.1",
      port,
      password: "secret",
      command: "status"
    }).catch((reason) => reason as WebRconError);
    expect(error.code).toBe("handshake");
    expect(error.message).not.toContain("secret");
  });

  it("rejects URLs disguised as hosts and invalid ports", async () => {
    await expect(
      executeWebRcon({ host: "127.0.0.1/path", port: 28016, password: "secret", command: "status" })
    ).rejects.toMatchObject({ code: "invalidTarget" });
    await expect(
      executeWebRcon({ host: "localhost", port: 0, password: "secret", command: "status" })
    ).rejects.toMatchObject({ code: "invalidTarget" });
  });

  it("defensively validates targets before opening a WebSocket", async () => {
    const port = await listen();
    const connection = vi.fn();
    server!.on("connection", connection);
    for (const patch of [
      { host: "http://127.0.0.1" },
      { host: "999.999.999.999" },
      { port: 0 },
      { password: "" },
      { password: "secret\ud800" }
    ]) {
      await expect(
        executeWebRcon({ host: "127.0.0.1", port, password: "secret", command: "status", ...patch })
      ).rejects.toBeInstanceOf(WebRconError);
    }
    expect(connection).not.toHaveBeenCalled();
  });

  it("prints the command result through the instance console", async () => {
    const port = await listen();
    server!.on("connection", (socket) =>
      socket.on("message", () =>
        socket.send(JSON.stringify({ Identifier: 1001, Message: "2 players" }))
      )
    );
    const print = vi.fn();
    const instance = {
      config: { rconIp: "127.0.0.1", rconPort: port, rconPassword: "secret" },
      process: {},
      print,
      println: vi.fn(),
      status: () => 3
    } as unknown as Instance;

    await new WebRconCommand().exec(instance, "status");
    expect(print).toHaveBeenCalledWith("[RCON] <<< status\n");
    expect(print).toHaveBeenCalledWith("[RCON] 2 players\n");
  });

  it("does not report an expected close as an error during shutdown", async () => {
    const port = await listen();
    server!.on("connection", (socket) => socket.on("message", () => socket.close()));
    const println = vi.fn();
    const instance = {
      config: { rconIp: "127.0.0.1", rconPort: port, rconPassword: "secret" },
      process: {},
      print: vi.fn(),
      println,
      status: () => 1
    } as unknown as Instance;

    await new WebRconCommand().exec(instance, "quit");
    expect(println).not.toHaveBeenCalled();
  });

  it("does not contact RCON when its instance is stopped", async () => {
    const port = await listen();
    const connection = vi.fn();
    server!.on("connection", connection);
    const println = vi.fn();
    const instance = {
      config: { rconIp: "127.0.0.1", rconPort: port, rconPassword: "secret" },
      print: vi.fn(),
      println,
      status: () => 0
    } as unknown as Instance;

    await new WebRconCommand().exec(instance, "status");
    expect(connection).not.toHaveBeenCalled();
    expect(println).toHaveBeenCalled();
  });
});
