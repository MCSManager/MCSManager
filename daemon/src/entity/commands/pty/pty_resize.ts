import Instance from "../../instance/instance";
import InstanceCommand from "../base/command";
import { GoPtyProcessAdapter } from "./pty_start";

interface IResizeOptions {
  h: number;
  w: number;
}

export default class PtyResizeCommand extends InstanceCommand {
  constructor() {
    super("ResizeTTY");
  }

  async exec(instance: Instance, size?: IResizeOptions): Promise<any> {
    const pty = instance.process as Partial<GoPtyProcessAdapter>;
    if (typeof pty?.resize === "function") {
      pty?.resize(size.w, size.h);
    }
  }
}
