export class JavaInfo implements IJavaInfo {
  public fullname: string;
  public downloading: boolean = false;

  constructor(public name: string, public version: string, public installTime: number) {
    this.fullname = this.name + "_" + this.version;
  }
}

export type JavaRuntime = IJavaRuntime;
