import Docker from "dockerode";
import Instance from "../../instance/instance";
import InstanceCommand from "../base/command";
import { t } from "i18next";

export function checkImage(name: string) {
  const docker = new Docker();
  try {
    const image = docker.getImage(name);
    return image.id ? true : false;
  } catch (error) {
    return false;
  }
}

export default class DockerPullCommand extends InstanceCommand {
  constructor() {
    super("DockerPullCommand");
  }

  async exec(instance: Instance) {
    const imageName = instance.config.docker.image;
    if (!imageName) throw new Error(t("镜像名字不能为空！"));

    // If the image exists, there is no need to pull again.
    if (checkImage(imageName)) return;

    try {
      instance.setLock(true);
      instance.status(Instance.STATUS_BUSY);

      const docker = new Docker();

      instance.println(t("镜像管理"), t("我们正在下载镜像，请耐心等待。镜像名：") + imageName);
      await docker.pull(imageName, {});
      instance.println(t("镜像管理"), t("镜像下载完毕！"));
    } catch (err) {
      instance.println(t("镜像管理"), t("镜像下载错误：") + err.message);
      throw err;
    } finally {
      instance.status(Instance.STATUS_STOP);
      instance.setLock(false);
    }
  }
}
