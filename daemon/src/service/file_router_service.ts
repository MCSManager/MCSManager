import { $t } from "../i18n";
import InstanceSubsystem from "../service/system_instance";
import FileManager from "./system_file";

export function getFileManager(instanceUuid: string) {
  // Initialize a file manager for the instance, and assign codes, restrictions, etc.
  const instance = InstanceSubsystem.getInstance(instanceUuid);
  if (!instance)
    throw new Error($t("TXT_CODE_file_router_service.instanceNotExit", { uuid: instanceUuid }));
  const fileCode = instance.config?.fileCode;
  const cwd = instance.config.cwd;
  return new FileManager(cwd, fileCode);
}
