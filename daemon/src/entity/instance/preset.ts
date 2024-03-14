import { $t } from "../../i18n";
import { IPresetCommand } from "../commands/dispatcher";
export interface IExecutable {
  exec: (a: any, b?: any) => Promise<any>;
  stop?: (a: any) => Promise<void>;
}

export class PresetCommandManager {
  public readonly preset = new Map<IPresetCommand, IExecutable>();

  constructor(private self: any) {}

  setPreset(action: IPresetCommand, cmd: IExecutable) {
    this.preset.set(action, cmd);
  }

  getPreset(action: IPresetCommand) {
    return this.preset.get(action);
  }

  async execPreset(action: IPresetCommand, p?: any) {
    const cmd = this.preset.get(action);
    if (!cmd) throw new Error($t("TXT_CODE_preset.actionErr", { action: action }));
    return await cmd.exec(this.self, p);
  }

  clearPreset() {
    this.preset.clear();
  }
}
