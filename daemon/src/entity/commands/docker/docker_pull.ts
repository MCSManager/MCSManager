import { t } from "i18next";
import { DefaultDocker } from "../../../service/docker_service";
import { sleep } from "../../../tools/time";
import Instance from "../../instance/instance";
import InstanceCommand from "../base/command";

export function checkDockerName(name: string) {
  const asciiRegex = /^[\x00-\x7F]+$/;
  return asciiRegex.test(name);
}

export async function checkImage(name: string) {
  try {
    if (!checkDockerName(name)) throw new Error(t("TXT_CODE_99c6d1f1"));
    const docker = new DefaultDocker();
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

  private async awaitImageDone(instance: Instance, name: string) {
    let count = 0;
    while (true) {
      count++;
      instance.println("CONTAINER", t("TXT_CODE_977cb449"));

      if (await checkImage(name)) {
        return true;
      }

      if (count >= 20 * 30) {
        throw new Error(t("TXT_CODE_4cc91afe"));
      }

      if (this.stopFlag) {
        throw new Error(t("TXT_CODE_361a79c6"));
      }

      await sleep(3000);
    }
  }

  async exec(instance: Instance) {
    const imageName = instance.config.docker.image;
    if (!imageName) throw new Error(t("TXT_CODE_17be5f70"));
    const cachedStartCount = instance.startCount;

    // If the image exists, there is no need to pull again.
    if (await checkImage(imageName)) return;

    try {
      const docker = new DefaultDocker();
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
