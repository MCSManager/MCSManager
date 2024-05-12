import { $t } from "../../../i18n";
import logger from "../../../service/log";
import Instance from "../../instance/instance";
import InstanceCommand from "../base/command";
import { InstanceUpdateAction } from "../../../service/instance_update_action";

export default class GeneralUpdateCommand extends InstanceCommand {
  private updateTask?: InstanceUpdateAction;

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

      this.updateTask = new InstanceUpdateAction(instance);
      await this.updateTask.start();
      await this.updateTask.wait();
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

    await this.updateTask?.stop();
  }
}
