import { globalConfiguration, globalEnv } from "../entity/config";
import { $t } from "../i18n";

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
