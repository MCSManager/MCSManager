import { io } from "socket.io-client";
import type { Socket } from "socket.io-client";
import type { DefaultEventsMap } from "@socket.io/component-emitter";

export function useSocketIoClient() {
  let socket: Socket<DefaultEventsMap, DefaultEventsMap> | undefined;

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

  return { testConnect };
}
