import { Socket } from "socket.io";

// Application instance data stream forwarding adapter
export default class InstanceStreamListener {
  public readonly listenMap = new Map<string, Socket[]>();

  public constructor() {}

  public requestForward(socket: Socket, instanceUuid: string) {
    if (this.listenMap.has(instanceUuid)) {
      const sockets = this.listenMap.get(instanceUuid);
      if (!sockets) return;
      for (const iterator of sockets)
        if (iterator.id === socket.id)
          throw new Error(
            `This Socket ${socket.id} already exists in the specified instance listening table`
          );
      sockets.push(socket);
    } else {
      this.listenMap.set(instanceUuid, [socket]);
    }
  }

  public cannelForward(socket: Socket, instanceUuid: string) {
    if (!this.listenMap.has(instanceUuid))
      throw new Error(`The specified ${instanceUuid} does not exist in the listening table`);
    const socketList = this.listenMap.get(instanceUuid);
    socketList?.forEach((v, index) => {
      if (v.id === socket.id) socketList?.splice(index, 1);
    });
  }

  public forward(instanceUuid: string, data: any) {
    const sockets = this.listenMap.get(instanceUuid);
    sockets?.forEach((socket) => {
      if (socket && socket.connected) socket.emit("instance/stdout", data);
    });
  }

  public forwardViaCallback(instanceUuid: string, callback: (socket: Socket) => void) {
    if (this.listenMap.has(instanceUuid)) {
      const sockets = this.listenMap.get(instanceUuid);
      sockets?.forEach((socket) => {
        if (socket && socket.connected) callback(socket);
      });
    }
  }

  public hasListenInstance(instanceUuid: string) {
    return this.listenMap.has(instanceUuid) && this.listenMap?.get(instanceUuid)!.length > 0;
  }
}
