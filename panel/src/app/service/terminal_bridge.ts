import { io, Socket as ClientSocket } from "socket.io-client";
import { $t } from "../i18n";
import { logger } from "./log";
import { timeUuid } from "./password";
import RemoteRequest from "./remote_command";
import RemoteServiceSubsystem from "./remote_service";
import type RemoteService from "../entity/remote_service";
import { verifyProxyToken, revokeStreamNonce } from "./gateway_token";
import type { ProxyBinding } from "./gateway_token";

import type { Socket as ServerSocket } from "socket.io";

// --------------------------------------------------------------------------
// TerminalBridge — singleton that bridges a browser socket.io connection
// (panel server) to a per-(daemonId, instanceUuid) reused panel→daemon
// socket.io CLIENT. Only active in proxy mode; in direct mode no browser
// ever connects to the panel's /socket.io (the panel returns the daemon addr
// instead), and a stray browser connecting would be rejected by the invalid
// stream token.
//
// Wire protocol (matches the daemon's stream_router + instance_event_router
// so the frontend code path is identical):
//
// browser → panel:
//   emit("stream/auth",  { data: { password } })
//   emit("stream/input",  { data: { command } })
//   emit("stream/write",  { data: { input } })
//   emit("stream/resize", { data: { w, h } })
//   emit("stream/detail",  {})
//
// daemon → panel (forwarded verbatim to all browser subscribers):
//   emit("stream/auth",     { data: true | false })
//   emit("instance/stdout", { data: { instanceUuid, text } })
//   emit("instance/stopped", { data: { instanceUuid, instanceName } })
//   emit("instance/opened",  { data: { instanceUuid, instanceName } })
//   emit("instance/failure", { data: { instanceUuid, instanceName } })
//   emit("stream/detail",    { data: <InstanceDetail> })
//
// The arg shape for stream/* events is { data: <inner> } and the bridge adds
// NOTHING — it forwards the exact arg the browser/daemon sent.
// --------------------------------------------------------------------------

interface StreamClientEntry {
  streamClient: ClientSocket;
  ref: number;
  subscribers: Set<ServerSocket>;
  binding: ProxyBinding;
}

// Map keyed by `${daemonId}::${instanceUuid}`.
const streamClientMap = new Map<string, StreamClientEntry>();

// Daemon-side events that must be fanned out to all browser subscribers.
const DAEMON_FORWARD_EVENTS = [
  "instance/stdout",
  "instance/stopped",
  "instance/opened",
  "instance/failure",
  "stream/detail"
];

// Browser → daemon forward events (NO stream/auth — the daemon stream client
// already authed itself; streaming the browser auth to the daemon is not
// part of the wire protocol and would confuse the daemon's auth middleware).
const BROWSER_FORWARD_EVENTS = ["stream/input", "stream/write", "stream/resize", "stream/detail"];

class TerminalBridgeImpl {
  /**
   * Called by SocketService when a browser socket connects to the panel's
   * socket.io server. This module is the ONLY place that subscribes to the
   * panel server's `connection` events.
   */
  bindBrowserConnection(socket: ServerSocket): void {
    // Wait for the browser's stream/auth (the frontend emits this on connect).
    socket.on("stream/auth", (arg: any) => {
      const token = arg?.data?.password;
      if (typeof token !== "string" || !token) {
        socket.emit("stream/auth", { data: false });
        socket.disconnect();
        return;
      }

      const binding = verifyProxyToken(token, "stream");
      if (!binding) {
        socket.emit("stream/auth", { data: false });
        socket.disconnect();
        return;
      }

      // Mirror the daemon's auth-success so the frontend proceeds to
      // stream/detail.
      socket.emit("stream/auth", { data: true });

      this.attachStreamClient(socket, binding, token).catch((err) => {
        logger.error(
          `TerminalBridge: failed to attach stream client for daemon ${binding.daemonId} instance ${binding.instanceUuid}:`,
          err
        );
        socket.emit("stream/auth", { data: false });
        socket.disconnect();
      });
    });
  }

  /**
   * Acquire or reuse the per-instance daemon stream client, register the
   * browser socket as a subscriber, wire bidirectional forwarding, and
   * handle lifecycle/cleanup.
   */
  private async attachStreamClient(
    socket: ServerSocket,
    binding: ProxyBinding,
    token: string
  ): Promise<void> {
    const mapKey = `${binding.daemonId}::${binding.instanceUuid}`;

    let entry = streamClientMap.get(mapKey);

    if (!entry || !entry.streamClient.connected) {
      // Need to (re)create the daemon stream client.
      const remoteService = RemoteServiceSubsystem.getInstance(binding.daemonId);
      if (!remoteService) {
        throw new Error($t("TXT_CODE_dd559000") + ` Daemon ID: ${binding.daemonId}`);
      }

      // Register a daemon stream_channel passport.
      const daemonStreamPass = timeUuid();
      await new RemoteRequest(remoteService).request("passport/register", {
        name: "stream_channel",
        password: daemonStreamPass,
        parameter: {
          instanceUuid: binding.instanceUuid
        }
      });

      // Create a fresh socket.io client to the daemon.
      const streamClient = io(remoteService.realUrl, {
        path: remoteService.config.canonicalPrefix + "/socket.io",
        transports: ["websocket"],
        reconnection: false,
        forceNew: true
      });

      // Await daemon auth before declaring the client usable.
      const authed = await new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => {
          resolve(false);
        }, 10_000);

        streamClient.on("connect", () => {
          streamClient.emit("stream/auth", { data: { password: daemonStreamPass } });
        });

        streamClient.on("stream/auth", (packet: any) => {
          clearTimeout(timeout);
          if (packet?.data === true) {
            resolve(true);
          } else {
            resolve(false);
          }
        });

        streamClient.on("connect_error", () => {
          clearTimeout(timeout);
          resolve(false);
        });

        streamClient.on("disconnect", () => {
          clearTimeout(timeout);
          resolve(false);
        });
      });

      if (!authed) {
        streamClient.disconnect();
        streamClient.removeAllListeners();
        if (entry) streamClientMap.delete(mapKey);
        throw new Error("Daemon stream auth failed");
      }

      entry = {
        streamClient,
        ref: 0,
        subscribers: new Set<ServerSocket>(),
        binding
      };
      streamClientMap.set(mapKey, entry);

      // Subscribe daemon→browser fan-out events.
      for (const event of DAEMON_FORWARD_EVENTS) {
        streamClient.on(event, (arg: any) => {
          // Fan out VERBATIM to all browser subscribers (same event + same arg).
          const subs = entry!.subscribers;
          for (const s of subs) {
            if (s.connected) s.emit(event, arg);
          }
        });
      }

      logger.info(
        `TerminalBridge: daemon stream client connected for daemon ${binding.daemonId} instance ${binding.instanceUuid}`
      );
    }

    // Register this browser socket as a subscriber.
    entry!.subscribers.add(socket);
    entry!.ref++;

    // Forward browser→daemon events verbatim (no stream/auth).
    for (const event of BROWSER_FORWARD_EVENTS) {
      socket.on(event, (arg: any) => {
        if (entry!.streamClient.connected) {
          entry!.streamClient.emit(event, arg);
        }
      });
    }

    // Lifecycle: browser disconnect → cleanup.
    socket.on("disconnect", () => {
      const e = streamClientMap.get(mapKey);
      if (!e) return;

      e.subscribers.delete(socket);
      e.ref--;

      // Remove the forward listeners we attached.
      for (const event of BROWSER_FORWARD_EVENTS) {
        socket.removeAllListeners(event);
      }

      if (e.ref <= 0) {
        // Last subscriber gone: disconnect the daemon stream client and
        // revoke the stream token (connection-level one-time).
        e.streamClient.removeAllListeners();
        e.streamClient.disconnect();
        streamClientMap.delete(mapKey);
        revokeStreamNonce(token);
        logger.info(
          `TerminalBridge: daemon stream client released for daemon ${binding.daemonId} instance ${binding.instanceUuid}`
        );
      }
    });
  }
}

const TerminalBridge = new TerminalBridgeImpl();
export { TerminalBridge };
export default TerminalBridge;
