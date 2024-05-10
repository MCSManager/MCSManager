import { $t } from "../../../i18n";
import { killProcess } from "common";
import { ChildProcess } from "child_process";
import logger from "../../../service/log";
import Instance from "../../instance/instance";
import InstanceCommand from "../base/command";
import Docker from "dockerode";
import { SetupDockerContainer } from "../../../service/docker_process_service";
import { InstanceUpdateAction } from "../../../service/instance_update_action";

export default class GeneralUpdateCommand extends InstanceCommand {
  private pid?: number;
  private process?: ChildProcess;
  private container?: Docker.Container;

  constructor() {
    super("GeneralUpdateCommand");
  }

  private stopped(instance: Instance) {
    instance.asynchronousTask = undefined;
    instance.setLock(false);
    instance.status(Instance.STATUS_STOP);
  }

  async exec(instance: Instance) {
    if (instance.status() !== Instance.STATUS_STOP && instance.status() !== Instance.STATUS_BUSY)
      return instance.failure(new Error($t("TXT_CODE_general_update.statusErr_notStop")));
    if (instance.asynchronousTask)
      return instance.failure(new Error($t("TXT_CODE_general_update.statusErr_otherProgress")));

    try {
      instance.setLock(true);
      instance.asynchronousTask = this;
      instance.status(Instance.STATUS_BUSY);

      const task = new InstanceUpdateAction(instance);
      await task.start();
      await task.wait();
    } catch (err: any) {
      instance.println(
        $t("TXT_CODE_general_update.update"),
        $t("TXT_CODE_general_update.error", { err: err })
      );
    } finally {
      this.stopped(instance);
    }
  }

  async stop(instance: Instance): Promise<void> {
    instance.asynchronousTask = undefined;
    logger.info(
      $t("TXT_CODE_general_update.terminateUpdate", { instanceUuid: instance.instanceUuid })
    );
    instance.println(
      $t("TXT_CODE_general_update.update"),
      $t("TXT_CODE_general_update.terminateUpdate", { instanceUuid: instance.instanceUuid })
    );
    instance.println(
      $t("TXT_CODE_general_update.update"),
      $t("TXT_CODE_general_update.killProcess")
    );

    if (instance.config.docker.image) {
      try {
        await this.container?.kill();
      } catch (error) {}
      return await this.container?.remove();
    }
    if (this.pid && this.process) {
      return killProcess(this.pid, this.process);
    }
  }
}
