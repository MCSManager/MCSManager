import type InstanceConfig from "../entity/instance/Instance_config";
import { $t } from "../i18n";
import type { DockerFileIdentity } from "./docker_file_ownership";

export function validateRootlessResourceLimits(
  identity: DockerFileIdentity,
  config: InstanceConfig["docker"]
): void {
  if (!identity.rootless) return;
  if (config.uploadSpeedLimit || config.downloadSpeedLimit) {
    throw new Error($t("TXT_CODE_rootless.networkLimitUnsupported"));
  }
  // These flags have no verified enforcement path in this compatibility layer.
  // Reject explicit requests instead of reporting a successfully isolated instance.
  if (
    config.cpusetCpus?.trim() ||
    config.deviceReadBps?.length ||
    config.deviceWriteBps?.length ||
    config.memorySwap != null ||
    config.memorySwappiness != null
  ) {
    throw new Error($t("TXT_CODE_rootless.unverifiedResourceLimit"));
  }
  for (const [value, supported] of [
    [config.memory, identity.resourceLimits?.memory],
    [config.cpuUsage, identity.resourceLimits?.cpu]
  ] as const) {
    if (
      value != null &&
      value !== 0 &&
      (typeof value !== "number" || !Number.isFinite(value) || value < 0 || !supported)
    ) {
      throw new Error($t("TXT_CODE_rootless.resourceLimitUnsupported"));
    }
  }
}
