export default class InstanceCommand {
  constructor(public info?: string) {}
  async exec(instance: any): Promise<any> {}
  async stop(instance: any) {}
}
