import SocketService from "./socket_service";

export interface Alert {
  id: string;
  type: "instance_offline" | "plugin_offline" | "tps_low" | "abnormal_stop";
  instanceName: string;
  instanceUuid: string;
  daemonId: string;
  message: string;
  timestamp: number;
}

export default class AlertService {
  private static readonly ALERT_ROOM = "alerts";

  public static pushAlert(alert: Alert): void {
    if (!SocketService.server) {
      return;
    }
    SocketService.server.to(this.ALERT_ROOM).emit("alert", alert);
  }
}
