import Docker from "dockerode";
import Instance from "../../instance/instance";
import InstanceCommand from "../base/command";
import { t } from "i18next";

export async function checkImage(name: string) {
  const docker = new Docker();
  try {
    const image = docker.getImage(name);
    const info = await image.inspect();
    console.debug("得到信息：", info.Size, info.Id);
    return info.Size > 0 ? true : false;
  } catch (error) {
    return false;
  }
}

function awaitImageDone(instance: Instance, name: string) {
  return new Promise((resolve, reject) => {
    let count = 0;
    const task = setInterval(async () => {
      count++;
      instance.println("Container", t("正在下载镜像文件中..."));
      if (await checkImage(name)) {
        clearInterval(task);
        resolve(true);
      }
      if (count >= 6 * 15) {
        clearInterval(task);
        reject(new Error(t("镜像下载超时！我们最多只能等待 15 分钟，请检查您的网络！")));
      }
      if (instance.status() !== Instance.STATUS_STARTING) {
        clearInterval(task);
        reject(new Error(t("镜像下载被终止！")));
      }
    }, 10 * 1000);
  });
}

export default class DockerPullCommand extends InstanceCommand {
  constructor() {
    super("DockerPullCommand");
  }

  async exec(instance: Instance) {
    const imageName = instance.config.docker.image;
    if (!imageName) throw new Error(t("镜像名字不能为空！"));
    const cachedStartCount = instance.startCount;
    // If the image exists, there is no need to pull again.
    if (await checkImage(imageName)) return;

    try {
      instance.setLock(true);

      const docker = new Docker();
      instance.println("Container", t("正在下载镜像文件，请耐心等待。镜像名：") + imageName);
      await docker.pull(imageName, {});
      await awaitImageDone(instance, imageName);

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
      instance.setLock(false);
    }
  }
}
