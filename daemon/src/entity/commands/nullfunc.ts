import InstanceCommand from "./base/command";

export default class NullCommand extends InstanceCommand {
  constructor() {
    super("NullCommand");
  }
  async exec() {
    // Do nothing.....
  }
}
