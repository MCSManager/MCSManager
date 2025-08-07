interface Data {
  value: any;
  ttl: number;
}

class KeyValueStore {
  private readonly envMap: Map<string, Data> = new Map();

  constructor() {
    setInterval(() => {
      const now = Date.now();
      for (const [key, data] of this.envMap) {
        if (now >= data.ttl) {
          this.envMap.delete(key);
        }
      }
    }, 1000);
  }

  get<T = any>(key: string): T | undefined {
    return this.envMap.get(key) as T | undefined;
  }

  set<T = any>(key: string, value: T, ttl: number = 0) {
    this.envMap.set(key, {
      value,
      ttl: Date.now() + ttl * 1000
    });
  }
}

// singleton
export const keyValueStore = new KeyValueStore();
