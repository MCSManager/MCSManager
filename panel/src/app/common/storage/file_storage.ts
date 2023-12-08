import { IStorage } from "./storage_interface";
import { StorageSubsystem } from "common";

const storage = new StorageSubsystem();

class FileStorageSubsystemAdapter implements IStorage {
  public async store(category: string, uuid: string, object: any) {
    return storage.store(category, uuid, object);
  }

  public async load(category: string, classz: any, uuid: string) {
    return storage.load(category, classz, uuid);
  }

  public async list(category: string) {
    return storage.list(category);
  }

  public async delete(category: string, uuid: string) {
    return storage.delete(category, uuid);
  }
}

export default new FileStorageSubsystemAdapter();
