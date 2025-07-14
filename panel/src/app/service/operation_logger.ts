import { JsonlStorageSubsystem } from "./../common/storage/jsonl_storage";
import { v4 } from "uuid";
import type { OperationLoggerItem, OperationLoggerItemPayload } from "../../types/operation_logger";

class OperationLogger {
  #storage: JsonlStorageSubsystem;
  #buffer: Map<string, OperationLoggerItem>;
  #bufferSize: number;

  constructor(bufferSize = 20) {
    this.#storage = new JsonlStorageSubsystem("/operation_logs");
    this.#buffer = new Map();
    this.#bufferSize = bufferSize;
  }

  async store(buffer: Map<string, OperationLoggerItem> = this.#buffer) {
    if (buffer.size === 0) return true;
    const entries = Array.from(buffer.values());
    await this.#storage.append("global", entries);
    return true;
  }

  storeSync(buffer: Map<string, OperationLoggerItem> = this.#buffer) {
    if (buffer.size === 0) return true;
    const entries = Array.from(buffer.values());
    this.#storage.append("global", entries, true);
    return true;
  }

  checkBufferQueue() {
    if (this.#buffer.size < this.#bufferSize) return;
    const currentBuffer = this.#buffer;
    this.#buffer = new Map();
    this.store(currentBuffer);
  }

  log<T extends keyof OperationLoggerItemPayload>(
    type: T,
    payload: Omit<
      OperationLoggerItemPayload[T],
      "operation_id" | "operation_time" | "operation_level"
    >,
    level: "info" | "warning" | "error" = "info"
  ) {
    const operation_id = v4();
    const operation_time = Date.now().toString();
    const item: OperationLoggerItem = {
      type,
      operation_id,
      operation_time,
      operation_level: level,
      ...payload
    } as unknown as OperationLoggerItem;

    this.#buffer.set(operation_id, item);
    this.checkBufferQueue();
    return operation_id;
  }

  async get(limit = 20) {
    if (limit <= this.#buffer.size) return Array.from(this.#buffer.values()).slice(-limit);
    await this.store();
    const entries = await this.#storage.tail("global", limit);
    return entries;
  }
}

export const operationLogger = new OperationLogger();

process.on("SIGINT", () => {
  operationLogger.storeSync();
});

process.on("exit", () => {
  operationLogger.storeSync();
});
