import fs from "fs-extra";
import { $t } from "../../../i18n";
import {
  DockerProcessAdapter,
  SetupDockerContainer,
  StartupDockerProcessError
} from "../../../service/docker_process_service";
import logger from "../../../service/log";
import Instance from "../../instance/instance";
import AbsStartCommand from "../start";
import { DiskQuotaService } from "../../../service/disk_quota_service";

export default class DockerStartCommand extends AbsStartCommand {
  protected async createProcess(instance: Instance) {
    // Check disk quota before starting the instance
    const quotaService = DiskQuotaService.getInstance();
    const quota = quotaService["quotaMap"].get(instance.instanceUuid);
    if (quota && quota > 0) {
      // Check if current disk usage exceeds quota
      const exceeds = await quotaService.exceedsQuota(instance);
      if (exceeds) {
        // Get quota info for logging
        const quotaInfo = await quotaService.getQuotaInfo(instance);
        logger.warn(
          `Instance ${instance.config.nickname} (${instance.instanceUuid}) exceeds disk quota before start: ` +
          `Used ${Math.round(quotaInfo.used / (1024 * 1024))}MB of ${Math.round(quotaInfo.limit / (1024 * 1024))}MB limit`
        );
        
        // Print warning to the instance console
        instance.println("WARN", $t("TXT_CODE_disk_quota_exceeded", {
          used: Math.round(quotaInfo.used / (1024 * 1024)),
          limit: Math.round(quotaInfo.limit / (1024 * 1024))
        }));
        
        throw new StartupDockerProcessError($t("TXT_CODE_disk_quota_exceeded_write"));
      }
    }

    if (!instance.hasCwdPath() || !instance.config.ie || !instance.config.oe)
      throw new StartupDockerProcessError($t("TXT_CODE_a6424dcc"));
    if (!fs.existsSync(instance.absoluteCwdPath())) fs.mkdirpSync(instance.absoluteCwdPath());

    // Docker docks to the process adapter
    const processAdapter = new DockerProcessAdapter(new SetupDockerContainer(instance));
    await processAdapter.start({
      isTty: instance.config.terminalOption.pty,
      w: instance.config.terminalOption.ptyWindowCol,
      h: instance.config.terminalOption.ptyWindowRow
    });

    instance.started(processAdapter);
    instance.println("INFO", $t("TXT_CODE_b50ffba8"));
    logger.info(
      $t("TXT_CODE_instance.successful", {
        v: `${instance.config.nickname} ${instance.instanceUuid}`
      })
    );
  }
}
