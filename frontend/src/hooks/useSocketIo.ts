import { mapDaemonAddress, parseForwardAddress } from "@/tools/protocol";
import { removeTrail } from "@/tools/string";
import type { DefaultEventsMap } from "@socket.io/component-emitter";
import type { Socket } from "socket.io-client";
import { io } from "socket.io-client";
import { ref } from "vue";
import type { ComputedNodeInfo } from "./useOverviewInfo";

// eslint-disable-next-line no-unused-vars
export enum SocketStatus {
  // eslint-disable-next-line no-unused-vars
  Connected = 1,
  // eslint-disable-next-line no-unused-vars
  Connecting = 2,
  // eslint-disable-next-line no-unused-vars
  Error = 0
}

export function makeSocketIo(addr: string, prefix?: string) {
  prefix = removeTrail((prefix ?? "").trim(), "/");
  return io(parseForwardAddress(addr, "ws"), {
    path: prefix + "/socket.io",
    multiplex: false,
    reconnectionDelayMax: 1000 * 10,
    timeout: 1000 * 30,
    reconnection: true,
    reconnectionAttempts: 3,
    rejectUnauthorized: false
  });
}

export function useSocketIoClient() {
  let socket: Socket<DefaultEventsMap, DefaultEventsMap> | undefined;
  const socketStatus = ref<SocketStatus>(SocketStatus.Connecting);

  const testFrontendSocket = async (remoteNode?: Partial<ComputedNodeInfo>) => {
    const nodeCfg = remoteNode;

    if (!nodeCfg?.available || !nodeCfg.ip) {
      socketStatus.value = SocketStatus.Error;
    } else {
      try {
        socketStatus.value = SocketStatus.Connecting;
        let addr = `${nodeCfg.ip}:${nodeCfg.port}`,
          prefix = nodeCfg.prefix;
        if (nodeCfg.remoteMappings) {
          const mapped = mapDaemonAddress(
            nodeCfg.remoteMappings.map((entry) => ({
              from: {
                addr: `${entry.from.ip}:${entry.from.port}`,
                prefix: entry.from.prefix
              },
              to: {
                addr: `${entry.to.ip}:${entry.to.port}`,
                prefix: entry.to.prefix
              }
            }))
          );
          if (mapped) {
            addr = mapped.addr;
            prefix = mapped.prefix;
          }
        }
        await testConnect(addr, prefix);
        socketStatus.value = SocketStatus.Connected;
      } catch (error) {
        console.error("Socket error: ", error);
        socketStatus.value = SocketStatus.Error;
      }
    }
  };

  const testConnect = (addr: string, prefix?: string) => {
    socket = makeSocketIo(addr, prefix);

    return new Promise<Socket<DefaultEventsMap, DefaultEventsMap>>((resolve, reject) => {
      if (!socket) return reject(new Error("[Socket.io] socket is undefined"));

      socket.on("connect", () => {
        try {
          socket?.disconnect();
        } finally {
          resolve(socket!);
        }
      });

      socket.on("connect_error", (error) => {
        reject(error);
      });
    });
  };

  return { testConnect, testFrontendSocket, socketStatus };
}
