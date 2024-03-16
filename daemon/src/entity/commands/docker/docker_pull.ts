import Docker from "dockerode";
import Instance from "../../instance/instance";
import InstanceCommand from "../base/command";
import { t } from "i18next";

export async function checkImage(name: string) {
  const docker = new Docker();
  try {
    const image = docker.getImage(name);
    const info = await image.inspect();
    return info.Size > 0 ? true : false;
  } catch (error: any) {
    return false;
  }
}

export default class DockerPullCommand extends InstanceCommand {
  constructor() {
    super("DockerPullCommand");
  }

  private stopFlag = false;

  private stopped(instance: Instance) {
    this.stopFlag = true;
    instance.asynchronousTask = undefined;
  }

  private awaitImageDone(instance: Instance, name: string) {
    return new Promise((resolve, reject) => {
      let count = 0;
      const task = setInterval(async () => {
        count++;
        instance.println("CONTAINER", t("TXT_CODE_977cb449"));
        if (await checkImage(name)) {
          clearInterval(task);
          resolve(true);
        }
        if (count >= 20 * 15) {
          clearInterval(task);
          reject(new Error(t("TXT_CODE_9cae6f92")));
        }
        if (this.stopFlag) {
          clearInterval(task);
          reject(new Error(t("TXT_CODE_361a79c6")));
        }
      }, 3 * 1000);
    });
  }

  async exec(instance: Instance) {
    const imageName = instance.config.docker.image;
    if (!imageName) throw new Error(t("TXT_CODE_17be5f70"));
    const cachedStartCount = instance.startCount;
    // If the image exists, there is no need to pull again.
    if (await checkImage(imageName)) return;

    try {
      const docker = new Docker();
      instance.println("CONTAINER", t("TXT_CODE_2fa46b8c") + imageName);
      instance.asynchronousTask = this;

      await docker.pull(imageName, {});

      await this.awaitImageDone(instance, imageName);
      if (cachedStartCount !== instance.startCount) return;
      instance.println("CONTAINER", t("TXT_CODE_c68b0bef"));
    } catch (err: any) {
      if (cachedStartCount !== instance.startCount) return;
      throw new Error([t("TXT_CODE_db37b7f9"), err?.message].join("\n"));
    } finally {
      this.stopped(instance);
    }
  }

  async stop(instance: Instance): Promise<void> {
    this.stopped(instance);
  }
}
