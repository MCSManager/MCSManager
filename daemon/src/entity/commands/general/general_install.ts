import { $t } from "../../../i18n";
import Instance from "../../instance/instance";
import InstanceCommand from "../base/command";
import fs from "fs-extra";
import { QuickInstallTask } from "../../../service/async_task_service/quick_install";
import { IQuickStartPackages } from "common/global";

export default class GeneralInstallCommand extends InstanceCommand {
  private process?: QuickInstallTask;

  constructor() {
    super("GeneralInstallCommand");
  }

  private stopped(instance: Instance) {
    instance.asynchronousTask = undefined;
    instance.setLock(false);
    instance.status(Instance.STATUS_STOP);
  }

  async exec(instance: Instance, params?: IQuickStartPackages) {
    if (instance.status() !== Instance.STATUS_STOP)
      return instance.failure(new Error($t("TXT_CODE_general_update.statusErr_notStop")));
    if (instance.asynchronousTask)
      return instance.failure(new Error($t("TXT_CODE_general_update.statusErr_otherProgress")));
    if (!params) throw new Error("GeneralInstallCommand: No params");
    try {
      instance.setLock(true);
      instance.status(Instance.STATUS_BUSY);
      instance.println($t("TXT_CODE_1704ea49"), $t("TXT_CODE_cbc235ad"));
      if (instance.config.cwd.length > 1) {
        fs.removeSync(instance.config.cwd);
        fs.mkdirsSync(instance.config.cwd);
      }
      instance.println($t("TXT_CODE_1704ea49"), $t("TXT_CODE_906c5d6a"));
      this.process = new QuickInstallTask(
        instance.config.nickname,
        params.targetLink,
        params.setupInfo,
        instance
      );
      instance.asynchronousTask = this;
      instance.println($t("TXT_CODE_1704ea49"), $t("TXT_CODE_b9ca022b"));
      await this.process.start();
      instance.println($t("TXT_CODE_1704ea49"), $t("TXT_CODE_f220ed78"));
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
    instance.println(
      $t("TXT_CODE_general_update.update"),
      $t("TXT_CODE_general_update.killProcess")
    );
    this.stopped(instance);
    await this.process?.stop();
  }
}
