import { Mutex } from "async-mutex";

export const mutexMap = new WeakMap<Function, Mutex>();
export const mutexIdMap = new Map<string, Mutex>();

export async function execWithMutex<T>(fn: () => Promise<T>): Promise<T> {
  let mutex = mutexMap.get(fn);
  if (!mutex) {
    mutex = new Mutex();
    mutexMap.set(fn, mutex);
  }
  const releaseLock = await mutex.acquire();
  try {
    return await fn();
  } finally {
    releaseLock();
    mutexMap.delete(fn);
  }
}

export async function execWithMutexId<T>(id: string, fn: () => Promise<T>) {
  let mutex = mutexIdMap.get(id);
  if (!mutex) {
    mutex = new Mutex();
    mutexIdMap.set(id, mutex);
  }
  const releaseLock = await mutex.acquire();
  try {
    return await fn();
  } finally {
    releaseLock();
    mutexIdMap.delete(id);
  }
}
