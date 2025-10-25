import { $t } from "../../../i18n";
import { InstanceUpdateAction } from "../../../service/instance_update_action";
import logger from "../../../service/log";
import Instance from "../../instance/instance";
import InstanceCommand from "../base/command";

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
    const userUuid: string = instance.config.userUuid;

    if (instance.status() !== Instance.STATUS_STOP && instance.status() !== Instance.STATUS_BUSY)
      return instance.failure(new Error($t("TXT_CODE_general_update.statusErr_notStop", userUuid)));
    if (instance.asynchronousTask)
      return instance.failure(new Error($t("TXT_CODE_general_update.statusErr_otherProgress", userUuid)));

    try {
      instance.setLock(true);
      instance.asynchronousTask = this;
      instance.status(Instance.STATUS_BUSY);

      this.updateTask = new InstanceUpdateAction(instance);
      await this.updateTask?.start();
      await this.updateTask?.wait();
    } catch (err: any) {
      instance.println(
        $t("TXT_CODE_general_update.update", userUuid),
        $t("TXT_CODE_general_update.error", { err: err }, userUuid)
      );
    } finally {
      this.stopped(instance);
    }
  }

  async stop(instance: Instance): Promise<void> {
    const userUuid: string = instance.config.userUuid;

    instance.asynchronousTask = undefined;
    logger.info(
      $t("TXT_CODE_general_update.terminateUpdate", { instanceUuid: instance.instanceUuid }, userUuid)
    );
    instance.println(
      $t("TXT_CODE_general_update.update", userUuid),
      $t("TXT_CODE_general_update.terminateUpdate", { instanceUuid: instance.instanceUuid }, userUuid)
    );
    instance.println(
      $t("TXT_CODE_general_update.update", userUuid),
      $t("TXT_CODE_general_update.killProcess", userUuid)
    );
    await this.updateTask?.stop();
    this.updateTask = undefined;
  }
}
