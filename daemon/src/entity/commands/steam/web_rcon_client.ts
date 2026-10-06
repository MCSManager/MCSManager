import WebSocket from "ws";
import { validateWebRconTarget, WebRconError } from "../../../common/web_rcon";

export { WebRconError, type WebRconErrorCode } from "../../../common/web_rcon";

interface WebRconOptions {
  host: string;
  port: number;
  password: string;
  command: string;
  connectTimeoutMs?: number;
  responseTimeoutMs?: number;
}

const IDENTIFIER = 1001;

export async function executeWebRcon({
  host,
  port,
  password,
  command,
  connectTimeoutMs = 6000,
  responseTimeoutMs = 10000
}: WebRconOptions): Promise<string> {
  const url = validateWebRconTarget(host, port, password);

  return new Promise((resolve, reject) => {
    let socket: WebSocket;
    let timer: NodeJS.Timeout;
    let settled = false;
    let writeConfirmed = false;
    let opened = false;

    const finish = (error?: WebRconError, response?: string) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      socket.terminate();
      if (error) reject(error);
      else resolve(response ?? "");
    };

    try {
      socket = new WebSocket(url, {
        handshakeTimeout: connectTimeoutMs,
        maxPayload: 4 * 1024 * 1024
      });
    } catch {
      reject(new WebRconError("invalidTarget"));
      return;
    }

    timer = setTimeout(() => finish(new WebRconError("connect")), connectTimeoutMs);
    socket.on("open", () => {
      opened = true;
      clearTimeout(timer);
      timer = setTimeout(
        () => finish(new WebRconError("timeout", writeConfirmed)),
        responseTimeoutMs
      );
      try {
        socket.send(
          JSON.stringify({ Identifier: IDENTIFIER, Message: command, Name: "WebRcon" }),
          (error) => {
            if (error) {
              finish(new WebRconError("sendFailed"));
              return;
            }
            // This confirms the local write, not execution by Rust.
            writeConfirmed = true;
          }
        );
      } catch {
        finish(new WebRconError("sendFailed"));
      }
    });
    socket.on("message", (raw) => {
      let packet: any;
      try {
        packet = JSON.parse(raw.toString());
      } catch {
        finish(new WebRconError("invalidResponse", writeConfirmed));
        return;
      }
      if (packet?.Identifier !== IDENTIFIER) return;
      if (typeof packet.Message !== "string") {
        finish(new WebRconError("invalidResponse", writeConfirmed));
        return;
      }
      finish(undefined, packet.Message);
    });
    socket.on("unexpected-response", (_request, response) => {
      response.resume();
      finish(new WebRconError("handshake"));
    });
    socket.on("error", () =>
      finish(new WebRconError(opened ? "connectionError" : "connect", writeConfirmed))
    );
    socket.on("close", () => finish(new WebRconError("closed", writeConfirmed)));
  });
}
