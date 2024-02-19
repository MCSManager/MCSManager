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
  } catch (error) {
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
    instance.asynchronousTask = null;
  }

  private awaitImageDone(instance: Instance, name: string) {
    return new Promise((resolve, reject) => {
      let count = 0;
      const task = setInterval(async () => {
        count++;
        instance.println("Container", t("正在下载镜像文件中..."));
        if (await checkImage(name)) {
          clearInterval(task);
          resolve(true);
        }
        if (count >= 12 * 15) {
          clearInterval(task);
          reject(new Error(t("镜像下载超时！我们最多只能等待 15 分钟，请检查您的网络！")));
        }
        if (this.stopFlag) {
          clearInterval(task);
          reject(new Error(t("镜像下载终止！")));
        }
      }, 1 * 1000);
    });
  }

  async exec(instance: Instance) {
    const imageName = instance.config.docker.image;
    if (!imageName) throw new Error(t("镜像名字不能为空！"));
    const cachedStartCount = instance.startCount;
    // If the image exists, there is no need to pull again.
    if (await checkImage(imageName)) return;

    try {
      const docker = new Docker();
      instance.println("Container", t("正在下载镜像文件，请耐心等待。镜像名：") + imageName);
      instance.asynchronousTask = this;

      await docker.pull(imageName, {});

      await this.awaitImageDone(instance, imageName);
      if (cachedStartCount !== instance.startCount) return;
      instance.println("Container", t("镜像下载完毕！"));
    } catch (err) {
      if (cachedStartCount !== instance.startCount) return;
      instance.println(
        "Container",
        [
          t(
            "镜像下载错误，请确保此镜像名正确，或者在节点管理的终端处手动通过 docker pull 拉取你需要的镜像，错误信息："
          ),
          err.message
        ].join("\n")
      );
      throw err;
    } finally {
      this.stopped(instance);
    }
  }

  async stop(instance: Instance): Promise<void> {
    this.stopped(instance);
  }
}
