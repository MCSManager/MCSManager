// Using SLT (Server List Ping) provided by Minecraft.
// https://wiki.vg/Server_List_Ping#Response

import net from "net";

export interface MinecraftPingResponse {
  host: string;
  port: number;
  online: boolean;
  version: string;
  motd: string;
  current_players: number;
  max_players: number;
  latency: number;
}

export default class PingMinecraftServer {
  public port: number;
  public host: string;
  public status: MinecraftPingResponse;
  public client?: net.Socket;

  constructor(port: number, host: string) {
    this.port = port;
    this.host = host;
    this.status = {
      online: false,
      host,
      port,
      version: "",
      motd: "",
      current_players: 0,
      max_players: 0,
      latency: 0
    };
  }

  getStatus() {
    return new Promise<MinecraftPingResponse>((resolve, reject) => {
      var start_time = new Date().getTime();
      this.client = net.connect(
        {
          host: this.host,
          port: this.port,
          timeout: 1000 * 15
        },
        () => {
          this.status.latency = Math.round(new Date().getTime() - start_time);
          // 0xFE packet identifier for a server list ping
          // 0x01 server list ping's payload (always 1)
          let data = Buffer.from([0xfe, 0x01]);
          this?.client?.write(data);
        }
      );

      // The client can also receive data from the server by reading from its socket.
      this?.client?.on("data", (response: any) => {
        // Check the readme for a simple explanation
        var server_info = response.toString().split("\x00\x00");

        this.status = {
          online: true,
          host: this.host,
          port: this.port,
          version: server_info[2].replace(/\u0000/g, ""),
          motd: server_info[3].replace(/\u0000/g, ""),
          current_players: server_info[4].replace(/\u0000/g, ""),
          max_players: server_info[5].replace(/\u0000/g, ""),
          latency: this.status.latency
        };

        // Request an end to the connection after the data has been received.
        this?.client?.end();
        resolve(this.status);
        this.destroy();
      });

      this?.client?.on("end", () => {
        resolve(this.status);
        this.destroy();
      });

      this?.client?.on("error", (err: any) => {
        reject(err);
        this.destroy();
      });
    });
  }

  private destroy() {
    this.client?.removeAllListeners();
  }

  async asyncStatus() {
    let status = await this.getStatus();
    return status;
  }
}

// async function test() {
//   try {
//     var status = await new MCServStatus(25565, "localhost").asyncStatus();
//     // console.log("status: ", status);
//   } catch (error) {
//     console.error("错误:", error);
//   }
//   const memoryUsage = process.memoryUsage();
//   console.log(
//     "RSS (Resident Set Size):",
//     (memoryUsage.rss / 1024 / 1024).toFixed(2),
//     "MB",
//     "Heap Total:",
//     (memoryUsage.heapTotal / 1024 / 1024).toFixed(2),
//     "MB",
//     "Heap Used:",
//     (memoryUsage.heapUsed / 1024 / 1024).toFixed(2),
//     "MB",
//     "External:",
//     (memoryUsage.external / 1024 / 1024).toFixed(2),
//     "MB"
//   );
//   // console.log("Heap Total:", (memoryUsage.heapTotal / 1024 / 1024).toFixed(2), "MB");
//   // console.log("External:", (memoryUsage.external / 1024 / 1024).toFixed(2), "MB");
//   // console.log("Heap Used:", (memoryUsage.heapUsed / 1024 / 1024).toFixed(2), "MB");
// }

// for (let index = 0; index < 10000; index++) {
//   test();
//   // @ts-ignore
//   // global.gc();
// }
