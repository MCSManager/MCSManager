import Koa from "koa";
import { diffConfig } from "../common/config_diff";
import { getOperationLoggerOperator, operationLogger } from "./operation_logger";
import RemoteRequest from "./remote_command";
import RemoteServiceSubsystem from "./remote_service";

async function readInstanceConfig(daemonId: string, instanceUuid: string) {
  try {
    const remoteService = RemoteServiceSubsystem.getInstance(daemonId);
    const detail = await new RemoteRequest(remoteService).request("instance/detail", {
      instanceUuid
    });
    return detail?.config ?? null;
  } catch {
    return null;
  }
}

export async function updateInstanceWithAudit<T>(
  ctx: Koa.ParameterizedContext,
  daemonId: string,
  instanceUuid: string,
  update: () => Promise<T>
): Promise<T> {
  const configBefore = await readInstanceConfig(daemonId, instanceUuid);
  const result = await update();
  const configAfter = await readInstanceConfig(daemonId, instanceUuid);

  const diff = diffConfig(configBefore, configAfter);
  if (diff) {
    operationLogger.log(
      "instance_config_change",
      {
        ...getOperationLoggerOperator(ctx),
        daemon_id: daemonId,
        instance_id: instanceUuid,
        instance_name: configAfter?.nickname ?? configBefore?.nickname,
        config_before: diff.before,
        config_after: diff.after
      },
      "warning"
    );
  }
  return result;
}
