import type { McsmMonitorOverviewResponse, McsmMonitorServerWithDaemon } from "./types.js";
import type { McsmClient } from "./mcsmClient.js";

interface ServerState {
  processRunning: boolean;
  pluginOnline: boolean;
  alerted: Set<string>;
}

export class AlertMonitor {
  private previousStates: Map<string, ServerState> = new Map();
  private intervalHandle: ReturnType<typeof setInterval> | null = null;
  private readonly alertedCooldown = 5 * 60 * 1000;

  constructor(
    private readonly client: Pick<McsmClient, "getMonitorOverview">,
    private readonly pushAlert: (alert: AlertPayload) => Promise<void>,
    private readonly pollIntervalMs: number
  ) {}

  start(): void {
    if (this.intervalHandle !== null) return;
    this.intervalHandle = setInterval(() => this.check(), this.pollIntervalMs);
  }

  stop(): void {
    if (this.intervalHandle !== null) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
  }

  private async check(): Promise<void> {
    let overview: McsmMonitorOverviewResponse;
    try {
      overview = await this.client.getMonitorOverview();
    } catch (error) {
      return;
    }

    for (const server of overview.servers) {
      const prev = this.previousStates.get(server.instanceId);
      const curr: ServerState = {
        processRunning: server.processRunning,
        pluginOnline: server.plugin.online,
        alerted: prev?.alerted ?? new Set()
      };

      if (prev) {
        await this.detectAndAlert(server, prev, curr);
      }

      this.previousStates.set(server.instanceId, curr);
    }

    for (const [instanceId, state] of this.previousStates) {
      const stillExists = overview.servers.some((s) => s.instanceId === instanceId);
      if (!stillExists) {
        this.previousStates.delete(instanceId);
      }
    }
  }

  private async detectAndAlert(
    server: McsmMonitorServerWithDaemon,
    prev: ServerState,
    curr: ServerState
  ): Promise<void> {
    if (prev.pluginOnline && !curr.pluginOnline) {
      await this.sendAlert(server, "plugin_offline", `实例 ${server.instanceName} 插件离线`);
    }

    if (!curr.processRunning && prev.processRunning) {
      await this.sendAlert(server, "abnormal_stop", `实例 ${server.instanceName} 非正常关闭`);
    }

    if (!curr.pluginOnline && !curr.processRunning && prev.pluginOnline) {
      await this.sendAlert(server, "instance_offline", `实例 ${server.instanceName} 已停止`);
    }

    const tpsLow = server.plugin.online && server.plugin.tps.oneMin < 10;
    if (tpsLow && !curr.alerted.has("tps_low")) {
      await this.sendAlert(server, "tps_low", `实例 ${server.instanceName} TPS 过低 (${server.plugin.tps.oneMin.toFixed(1)})`);
      curr.alerted.add("tps_low");
    } else if (!tpsLow) {
      curr.alerted.delete("tps_low");
    }
  }

  private async sendAlert(
    server: McsmMonitorServerWithDaemon,
    type: AlertPayload["type"],
    message: string
  ): Promise<void> {
    const now = Date.now();
    const cooldownKey = `${server.instanceId}:${type}`;
    const lastAlerted = this.previousStates.get(server.instanceId)?.alerted;

    if (lastAlerted?.has(cooldownKey)) {
      return;
    }

    try {
      await this.pushAlert({
        type,
        instanceName: server.instanceName,
        instanceUuid: server.instanceId,
        daemonId: server.daemonId,
        message
      });

      const state = this.previousStates.get(server.instanceId);
      if (state) {
        state.alerted.add(cooldownKey);
        setTimeout(() => {
          const s = this.previousStates.get(server.instanceId);
          if (s) s.alerted.delete(cooldownKey);
        }, this.alertedCooldown);
      }
    } catch (error) {
      // Silently ignore alert push failures
    }
  }
}

export interface AlertPayload {
  type: "instance_offline" | "plugin_offline" | "tps_low" | "abnormal_stop";
  instanceName: string;
  instanceUuid: string;
  daemonId: string;
  message: string;
}
