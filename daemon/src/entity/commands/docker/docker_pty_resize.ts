import Instance from "../../instance/instance";
import InstanceCommand from "../base/command";
import { DockerProcessAdapter } from "../../../service/docker_process_service";

export default class DockerResizeCommand extends InstanceCommand {
  constructor() {
    super("ResizeTTY");
  }

  async exec(instance: Instance): Promise<any> {
    const dockerProcess = instance?.process as Partial<DockerProcessAdapter>;
    if (typeof dockerProcess?.container?.resize === "function") {
      const { w, h } = instance.computeTerminalSize();
      await dockerProcess?.container?.resize({
        h,
        w
      });
    }
  }
}
