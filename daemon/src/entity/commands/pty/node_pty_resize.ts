import Instance from "../../instance/instance";
import InstanceCommand from "../base/command";
import { NodeProcessAdapter } from "./node_pty_start";

interface IResizeOptions {
  h: number;
  w: number;
}

export default class NodePtyResizeCommand extends InstanceCommand {
  constructor() {
    super("ResizeTTY");
  }

  async exec(instance: Instance, size?: IResizeOptions): Promise<any> {
    const dockerProcess = instance.process as Partial<NodeProcessAdapter>;
    if (typeof dockerProcess?.resize === "function") {
      dockerProcess?.resize(size.w, size.h);
    }
  }
}
