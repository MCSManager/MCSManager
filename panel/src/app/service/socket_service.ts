import http from "http";
import { Server, Socket } from "socket.io";
import WebSocketRouter from "../routers/socket_router";
import { logger } from "./log";

export default class SocketService {
  public static server: Server;
  public static readonly socketsMap = new Map<string, Socket>();

  public static setUpSocketIO(httpServer: http.Server) {
    const io = new Server(httpServer, {
      path: "/socket.io",
      cors: {
        // temporary
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
      },
      maxHttpBufferSize: 1e8
    });

    io.on("connection", (socket) => {
      // When the user is connected to the Websocket, join the global and bind related events
      logger.info(`Websocket ${socket.id}(${socket.handshake.address}) connection`);
      this.socketsMap.set(socket.id, socket);
      // bind the business event
      SocketService.bindEvents(socket);
      // When the user Websocket is disconnected, delete from the Socket list and release some resources
      socket.on("disconnect", () => {
        this.socketsMap.delete(socket.id);
        for (const name of socket.eventNames()) socket.removeAllListeners(name);
        logger.info(`Websocket ${socket.id}(${socket.handshake.address}) disconnected`);
      });
    });

    this.server = io;
    return this.server;
  }

  // used to bind Socket events
  private static bindEvents(socket: Socket) {
    new WebSocketRouter(socket);
  }
}
