import { randomBytes } from "crypto";
import { findInstanceByUuid } from "./instanceResolver.js";
import type {
  ConfirmationRecord,
  InstanceAction,
  McsmMonitorOverviewResponse,
  McsmMonitorServerWithDaemon
} from "./types.js";

export class ConfirmationStore {
  private readonly records = new Map<string, ConfirmationRecord>();

  constructor(private readonly ttlMs: number) {}

  prepare(instance: McsmMonitorServerWithDaemon, action: InstanceAction, now = Date.now()) {
    validateActionState(instance, action);
    const code = this.generateCode();
    const record: ConfirmationRecord = {
      code,
      daemonId: instance.daemonId,
      instanceUuid: instance.instanceId,
      instanceName: instance.instanceName,
      action,
      createdAt: now,
      expiresAt: now + this.ttlMs
    };
    this.records.set(code, record);
    return record;
  }

  consume(
    code: string,
    overview: McsmMonitorOverviewResponse,
    now = Date.now()
  ): { record: ConfirmationRecord; instance: McsmMonitorServerWithDaemon } {
    const normalizedCode = code.trim().toUpperCase();
    const record = this.records.get(normalizedCode);
    if (!record) throw new Error("确认码不存在或已使用。");

    this.records.delete(normalizedCode);
    if (record.expiresAt < now) throw new Error("确认码已过期，请重新发起操作。");

    const instance = findInstanceByUuid(overview, record.daemonId, record.instanceUuid);
    if (!instance) throw new Error("确认目标实例不存在，操作已取消。");

    validateActionState(instance, record.action);
    return { record, instance };
  }

  private generateCode(): string {
    let code = "";
    do {
      code = randomBytes(1).toString("hex").toUpperCase().padStart(2, "0");
    } while (this.records.has(code));
    return code;
  }
}

export function validateActionState(
  instance: McsmMonitorServerWithDaemon,
  action: InstanceAction
): void {
  if (!instance.daemonAvailable) {
    throw new Error(`节点不可用，不能对实例 ${instance.instanceName} 执行 ${action}。`);
  }
  if (action === "start" && instance.processRunning) {
    throw new Error(`实例 ${instance.instanceName} 已在运行，拒绝生成启动确认。`);
  }
  if ((action === "stop" || action === "restart") && !instance.processRunning) {
    throw new Error(`实例 ${instance.instanceName} 未运行，拒绝执行 ${action}。`);
  }
}
