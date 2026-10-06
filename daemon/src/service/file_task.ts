import { globalConfiguration, globalEnv } from "../entity/config";
import { $t } from "../i18n";

export function validateFileTransferTargets(
  targets: unknown
): asserts targets is [string, string][] {
  if (
    !Array.isArray(targets) ||
    targets.length === 0 ||
    targets.length > 100 ||
    [...targets].some(
      (target) =>
        !Array.isArray(target) ||
        target.length !== 2 ||
        typeof target[0] !== "string" ||
        target[0].length === 0 ||
        typeof target[1] !== "string" ||
        target[1].length === 0
    )
  )
    throw new Error($t("TXT_CODE_file_task.invalidTransferTargets"));
}

/** Reserve before starting background work; release exactly once in finally. */
export function acquireFileTask(info: { fileLock: number }): () => void {
  const instanceLimit = globalConfiguration.config.maxFileTask;
  const globalLimit = globalConfiguration.config.maxGlobalFileTask ?? 8;
  if (
    !Number.isSafeInteger(instanceLimit) ||
    instanceLimit < 1 ||
    !Number.isSafeInteger(globalLimit) ||
    globalLimit < 1 ||
    !Number.isSafeInteger(info.fileLock) ||
    info.fileLock < 0 ||
    !Number.isSafeInteger(globalEnv.fileTaskCount) ||
    globalEnv.fileTaskCount < 0 ||
    info.fileLock >= instanceLimit ||
    globalEnv.fileTaskCount >= globalLimit
  ) {
    throw new Error($t("TXT_CODE_file_task.limitExceeded"));
  }
  info.fileLock++;
  globalEnv.fileTaskCount++;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    info.fileLock--;
    globalEnv.fileTaskCount--;
  };
}
