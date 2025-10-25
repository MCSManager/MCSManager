import fs from "fs-extra";
import { $t } from "../../../i18n";
import { QuickInstallTask } from "../../../service/async_task_service/quick_install";
import Instance from "../../instance/instance";
import InstanceCommand from "../base/command";

export default class GeneralInstallCommand extends InstanceCommand {
  private installTask?: QuickInstallTask;

  constructor() {
    super("GeneralInstallCommand");
  }

  private stopped(instance: Instance) {
    instance.asynchronousTask = undefined;
    instance.setLock(false);
    instance.status(Instance.STATUS_STOP);
  }

  async exec(instance: Instance, params?: IQuickStartPackages) {
    const userUuid: string = instance.config.userUuid;

    if (instance.status() !== Instance.STATUS_STOP)
      return instance.failure(new Error($t("TXT_CODE_general_update.statusErr_notStop", userUuid)));
    if (instance.asynchronousTask)
      return instance.failure(new Error($t("TXT_CODE_general_update.statusErr_otherProgress", userUuid)));
    if (!params) throw new Error("GeneralInstallCommand: No params");
    try {
      instance.setLock(true);
      instance.status(Instance.STATUS_BUSY);
      instance.println($t("TXT_CODE_1704ea49", userUuid), $t("TXT_CODE_cbc235ad", userUuid));
      if (instance.hasCwdPath()) {
        await fs.remove(instance.absoluteCwdPath());
        await fs.mkdirs(instance.absoluteCwdPath());
      }
      instance.println($t("TXT_CODE_1704ea49", userUuid), $t("TXT_CODE_906c5d6a", userUuid));
      this.installTask = new QuickInstallTask(
        instance.config.nickname,
        params.targetLink,
        params.setupInfo,
        instance
      );
      instance.asynchronousTask = this;
      instance.println($t("TXT_CODE_1704ea49", userUuid), $t("TXT_CODE_b9ca022b", userUuid));
      await this.installTask?.start();
      await this.installTask?.wait();
    } catch (err: any) {
      instance.println(
        $t("TXT_CODE_general_update.update", userUuid),
        $t("TXT_CODE_general_update.error", { err }, userUuid)
      );
    } finally {
      this.stopped(instance);
    }
  }

  async stop(instance: Instance): Promise<void> {
    const userUuid: string = instance.config.userUuid;

    instance.println(
      $t("TXT_CODE_general_update.update", userUuid),
      $t("TXT_CODE_general_update.killProcess", userUuid)
    );
    this.stopped(instance);
    await this.installTask?.stop();
    this.installTask = undefined;
  }
}
