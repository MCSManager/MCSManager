import { io } from "socket.io-client";
import type { Socket } from "socket.io-client";
import type { DefaultEventsMap } from "@socket.io/component-emitter";
import type { ComputedNodeInfo } from "./useOverviewInfo";
import { ref } from "vue";
import { removeTrail } from "@/tools/string";

// eslint-disable-next-line no-unused-vars
export enum SocketStatus {
  // eslint-disable-next-line no-unused-vars
  Connected = 1,
  // eslint-disable-next-line no-unused-vars
  Connecting = 2,
  // eslint-disable-next-line no-unused-vars
  Error = 0
}

export function useSocketIoClient() {
  let socket: Socket<DefaultEventsMap, DefaultEventsMap> | undefined;
  const socketStatus = ref<SocketStatus>(SocketStatus.Connecting);
  const parseIp = (ip: string) => {
    if (ip.toLowerCase() === "localhost" || ip === "127.0.0.1") {
      return window.location.hostname;
    }
    return ip;
  };

  const testFrontendSocket = async (remoteNode?: Partial<ComputedNodeInfo>) => {
    const nodeCfg = remoteNode;

    if (!nodeCfg?.available || !nodeCfg.ip) {
      socketStatus.value = SocketStatus.Error;
    } else {
      try {
        socketStatus.value = SocketStatus.Connecting;
        await testConnect(
          parseIp(nodeCfg.ip) + ":" + nodeCfg.port,
          removeTrail(nodeCfg.prefix || "", "/") + "/socket.io"
        );
        socketStatus.value = SocketStatus.Connected;
      } catch (error) {
        console.error("Socket error: ", error);
        socketStatus.value = SocketStatus.Error;
      }
    }
  };

  const testConnect = (addr: string, path: string) => {
    socket = io(addr, {
      path,
      multiplex: false,
      timeout: 1000 * 30,
      reconnection: false,
      reconnectionAttempts: 0,
      rejectUnauthorized: false
    });

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

  return { testConnect, parseIp, testFrontendSocket, socketStatus };
}
