import Instance from "../../instance/instance";
import InstanceCommand from "../base/command";
import { GoPtyProcessAdapter } from "./pty_start";

export default class PtyResizeCommand extends InstanceCommand {
  constructor() {
    super("ResizeTTY");
  }

  async exec(instance: Instance): Promise<any> {
    const pty = instance.process as Partial<GoPtyProcessAdapter>;
    if (typeof pty?.resize === "function") {
      const { w, h } = instance.computeTerminalSize();
      pty?.resize(w, h);
    }
  }
}
