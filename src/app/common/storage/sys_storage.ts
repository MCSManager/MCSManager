import { IStorage } from "./storage_interface";
import file_storage from "./file_storage";
import redis_storage from "./redis_storage";

class SystemStorage {
  private storageSystem: IStorage = file_storage;

  public readonly TYPE = {
    FILE: 0,
    REDIS: 1
  };

  public setStorageType(type: number) {
    switch (type) {
      case this.TYPE.FILE: {
        // Using fs-based storage
        this.storageSystem = file_storage;
        break;
      }
      case this.TYPE.REDIS: {
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
