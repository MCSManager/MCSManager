import { JsonlStorageSubsystem } from "./../common/storage/jsonl_storage";
import { v4 } from "uuid";
import type { OperationLoggerItem, OperationLoggerItemPayload } from "../../types/operation_logger";
import RemoteRequest from "./remote_command";
import RemoteServiceSubsystem from "./remote_service";

type CleanPayload<T extends keyof OperationLoggerItemPayload> = Omit<
  OperationLoggerItemPayload[T],
  "operation_id" | "operation_time" | "operation_level"
>;

class OperationLogger {
  #storage: JsonlStorageSubsystem;
  #buffer: Map<string, OperationLoggerItem>;
  #bufferSize: number;

  constructor(bufferSize = 20) {
    this.#storage = new JsonlStorageSubsystem("/operation_logs");
    this.#buffer = new Map();
    this.#bufferSize = bufferSize;
  }

  async flushAsync(buffer: Map<string, OperationLoggerItem> = this.#buffer) {
    if (buffer.size === 0) return true;
    const entries = Array.from(buffer.values());
    await this.#storage.append("global", entries);
    return true;
  }

  flushSync(buffer: Map<string, OperationLoggerItem> = this.#buffer) {
    if (buffer.size === 0) return true;
    const entries = Array.from(buffer.values());
    this.#storage.append("global", entries, true);
    return true;
  }

  checkBufferQueue() {
    if (this.#buffer.size < this.#bufferSize) return;
    const currentBuffer = this.#buffer;
    this.#buffer = new Map();
    this.flushAsync(currentBuffer);
  }

  log<T extends keyof OperationLoggerItemPayload>(
    type: T,
    payload: CleanPayload<T>,
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
    const currentBuffer = this.#buffer;
    this.#buffer = new Map();
    await this.flushAsync(currentBuffer);
    return this.#storage.tail<OperationLoggerItem>("global", limit);
  }

  info<T extends keyof OperationLoggerItemPayload>(type: T, payload: CleanPayload<T>) {
    return this.log(type, payload, "info");
  }

  warning<T extends keyof OperationLoggerItemPayload>(type: T, payload: CleanPayload<T>) {
    return this.log(type, payload, "warning");
  }

  error<T extends keyof OperationLoggerItemPayload>(type: T, payload: CleanPayload<T>) {
    return this.log(type, payload, "error");
  }
}

export const operationLogger = new OperationLogger();

process.on("SIGINT", () => {
  operationLogger.flushSync();
});

process.on("exit", () => {
  operationLogger.flushSync();
});
