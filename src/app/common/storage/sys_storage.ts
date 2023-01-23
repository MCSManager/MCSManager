import { IStorage } from "./storage_interface";
import file_storage from "./file_storage";
import redis_storage from "./redis_storage";

class SystemStorage {
  private exclusions = ["Config", "SystemConfig"]; // Config is from daemon and SystemConfig is from panel
  private storageSystem: IStorage = file_storage;

  public setStorageType(type: number) {
    switch (type) {
      case 0: {
        // Using fs-based storage
        this.storageSystem = file_storage;
        break;
      }
      case 1: {
        // Using redis-based storage
        this.storageSystem = redis_storage;
        break;
      }
      default: {
        this.storageSystem = file_storage;
        break;
      }
    }
  }

  public getStorage() {
    return this.storageSystem;
  }
}

export default new SystemStorage();