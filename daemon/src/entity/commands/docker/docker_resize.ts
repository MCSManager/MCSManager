import Instance from "../../instance/instance";
import InstanceCommand from "../base/command";
import { DockerProcessAdapter } from "./docker_start";

export interface IResizeOptions {
  h: number;
  w: number;
}

export default class DockerResizeCommand extends InstanceCommand {
  constructor() {
    super("ResizeTTY");
  }

  async exec(instance: Instance, size?: IResizeOptions): Promise<any> {
    if (!instance.process || !(instance.config.processType === "docker")) return;
    const dockerProcess = <DockerProcessAdapter>instance.process;
    await dockerProcess?.container?.resize({
      h: size.h,
      w: size.w
    });
  }
}
