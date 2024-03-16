import { v4 } from "uuid";

export class UniversalRemoteSubsystem<T> {
  public readonly services: Map<string, T>;

  constructor() {
    this.services = new Map<string, T>();
  }

  setInstance(uuid: string, object: T): void {
    if (this.services.get(uuid)) throw new Error("Instance already exists");
    this.services.set(uuid, object);
  }

  getInstance(uuid: string) {
    return this.services.get(uuid);
  }

  deleteInstance(uuid: string) {
    return this.services.delete(uuid);
  }

  randdomUuid() {
    return v4().replace(/-/gim, "");
  }
}
