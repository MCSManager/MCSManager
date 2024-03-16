import { v4 } from "uuid";
import { IPacket, IRequestPacket } from "../entity/entity_interface";
import RemoteService from "../entity/remote_service";
import { $t } from "../i18n";

class RemoteError extends Error {
  constructor(msg: string) {
    super(msg);
  }
}

export class RemoteRequestTimeoutError extends RemoteError {
  constructor(msg: string) {
    super(msg);
  }
}

// Use RemoteRequest to send Socket.io events and data to remote services,
// and support synchronous response data (such as HTTP).
export default class RemoteRequest {
  constructor(public readonly rService?: RemoteService) {
    if (!this.rService || !this.rService.socket) throw new Error($t("TXT_CODE_ca8072bd"));
  }

  // request to remote daemon
  public async request(event: string, data?: any, timeout = 6000, force = false): Promise<any> {
    if (!this.rService || !this.rService.socket) throw new Error($t("TXT_CODE_3d94ea16"));
    if (!this.rService.available && !force)
      throw new Error($t("TXT_CODE_b7d38e78") + ` IP: ${this.rService.config.ip}`);
    if (!this.rService.socket.connected && !force)
      throw new Error($t("TXT_CODE_7c650d80") + ` IP: ${this.rService.config.ip}`);

    return new Promise((resolve, reject) => {
      let countdownTask: NodeJS.Timeout;
      const uuid = [v4(), new Date().getTime()].join("");
      const protocolData: IRequestPacket = { uuid, data };

      const fn = (msg: IPacket) => {
        if (msg.uuid === uuid) {
          if (countdownTask) clearTimeout(countdownTask);
          this.rService?.socket?.removeListener(event, fn);
          if (msg.status == RemoteService.STATUS_OK) resolve(msg.data);
          else if (msg.data.err) {
            reject(new RemoteError(msg.data.err));
          } else {
            reject(new RemoteError(msg.data));
          }
        }
      };

      if (timeout) {
        countdownTask = setTimeout(() => {
          this.rService?.socket?.removeListener(event, fn);
          reject(
            new RemoteRequestTimeoutError(
              [$t("TXT_CODE_bd99b64e"), this.rService?.config.ip].join(" ")
            )
          );
        }, timeout);
      }

      this.rService?.socket?.on(event, fn);
      // send command
      this.rService?.emit(event, protocolData);
    });
  }
}
