import { v4 } from "uuid";
import { IPacket, IRequestPacket } from "../entity/entity_interface";
import RemoteService from "../entity/remote_service";
import { $t } from "../i18n";

class RemoteError extends Error {
  constructor(msg: string) {
    super(msg);
  }
}

// Use RemoteRequest to send Socket.io events and data to remote services,
// and support synchronous response data (such as HTTP).
export default class RemoteRequest {
  constructor(public readonly rService: RemoteService) {
    if (!this.rService || !this.rService.socket) throw new Error($t("TXT_CODE_ca8072bd"));
  }

  // request to remote daemon
  public async request(event: string, data?: any, timeout = 6000, force = false): Promise<any> {
    if (!this.rService.socket) throw new Error($t("TXT_CODE_3d94ea16"));
    if (!this.rService.available && !force)
      throw new Error($t("TXT_CODE_b7d38e78") + ` IP: ${this.rService.config.ip}`);
    if (!this.rService.socket.connected && !force)
      throw new Error($t("TXT_CODE_7c650d80") + ` IP: ${this.rService.config.ip}`);

    return new Promise((resolve, reject) => {
      const uuid = [v4(), new Date().getTime()].join("");
      const protocolData: IRequestPacket = { uuid, data };

      let countdownTask: NodeJS.Timeout;
      if (timeout) {
        countdownTask = setTimeout(
          () =>
            reject(new RemoteError([$t("TXT_CODE_bd99b64e"), this.rService.config.ip].join(" "))),
          timeout
        );
      }

      // define event function
      const fn = (msg: IPacket) => {
        if (msg.uuid === uuid) {
          if (countdownTask) clearTimeout(countdownTask);
          // Whenever a message is returned, match the ID to ensure that the response corresponds to the request,
          // then delete its own event listener
          this.rService.socket.removeListener(event, fn);
          if (msg.status == RemoteService.STATUS_OK) resolve(msg.data);
          else if (msg.data.err) {
            reject(new RemoteError(msg.data.err));
          } else {
            reject(new RemoteError(msg.data));
          }
        }
      };
      this.rService.socket.on(event, fn);
      // send command
      this.rService.emit(event, protocolData);
    });
  }
}
