import Koa from "koa";
import { v4 } from "uuid";
import type {
  OperationLoggerItem,
  OperationLoggerItemPayload,
  OperationLoggerQuery,
  OperationLoggerQueryResult
} from "../../types/operation_logger";
import { systemConfig } from "../setting";
import { JsonlStorageSubsystem } from "./../common/storage/jsonl_storage";
import { getUserFromCtx, isApiRequest } from "./passport_service";
import RemoteServiceSubsystem from "./remote_service";

type CleanPayload<T extends keyof OperationLoggerItemPayload> = Omit<
  OperationLoggerItemPayload[T],
  "operation_id" | "operation_time" | "operation_level"
>;

const DAY_MS = 24 * 60 * 60 * 1000;
// Log files are named "<date>_<seq>", e.g. 2026-08-07_0001
const SEGMENT_REGEX = /^\d{4}-\d{2}-\d{2}_\d+$/;

function toDate(time: number) {
  const date = new Date(time);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function isCategoryEnabled(type: string) {
  if (!systemConfig) return true;
  if (type === "user_login") return systemConfig.operationLogRecordLogin !== false;
  if (type.startsWith("instance_file_")) return systemConfig.operationLogRecordFile !== false;
  if (type.startsWith("instance_")) return systemConfig.operationLogRecordInstance !== false;
  if (type.startsWith("user_") || type.startsWith("sso_"))
    return systemConfig.operationLogRecordUser !== false;
  return systemConfig.operationLogRecordSystem !== false;
}

export function getOperationLoggerOperator(ctx: Koa.ParameterizedContext) {
  return {
    operator_ip: ctx.ip,
    operator_name: getUserFromCtx(ctx)?.userName,
    operator_source: isApiRequest(ctx) ? ("api" as const) : undefined
  };
}

class OperationLogger {
  #storage: JsonlStorageSubsystem;
  #buffer: Map<string, OperationLoggerItem>;
  #cache = new Map<string, OperationLoggerItem[]>();
  #bufferSize: number;
  #flushTimer: NodeJS.Timeout | null = null;
  #flushChain: Promise<void> = Promise.resolve();
  #currentFile = "";
  #currentLines = 0;

  constructor(bufferSize = 20) {
    this.#storage = new JsonlStorageSubsystem("/operation_logs", Number.MAX_SAFE_INTEGER);
    this.#buffer = new Map();
    this.#bufferSize = bufferSize;
    this.startFlushTimer();
  }

  get enabled() {
    return systemConfig?.operationLogEnabled !== false;
  }

  get maxLinesPerFile() {
    return Number(systemConfig?.operationLogMaxLinesPerFile) || 200;
  }

  private files() {
    const all = this.#storage.list();
    return [
      ...all.filter((name) => !SEGMENT_REGEX.test(name)),
      ...all.filter((name) => SEGMENT_REGEX.test(name))
    ];
  }

  private async read(file: string) {
    const cached = this.#cache.get(file);
    if (cached) return cached;
    const entries = (await this.#storage.readAll(file)) as OperationLoggerItem[];
    this.#cache.set(file, entries);
    return entries;
  }

  private nextFile() {
    const date = toDate(Date.now());
    if (this.#currentFile.startsWith(date) && this.#currentLines < this.maxLinesPerFile) {
      return this.#currentFile;
    }
    let seq = 1;
    if (this.#currentFile.startsWith(date)) seq = Number(this.#currentFile.split("_")[1]) + 1;
    this.#currentFile = `${date}_${String(seq).padStart(4, "0")}`;
    this.#currentLines = 0;
    return this.#currentFile;
  }

  private async initCurrentFile() {
    if (this.#currentFile) return;
    const segments = this.files().filter((name) => SEGMENT_REGEX.test(name));
    const last = segments[segments.length - 1];
    if (!last) return;
    this.#currentFile = last;
    this.#currentLines = (await this.read(last)).length;
  }

  private takeChunk(entries: OperationLoggerItem[]) {
    const file = this.nextFile();
    const room = Math.max(1, this.maxLinesPerFile - this.#currentLines);
    const chunk = entries.splice(0, room);
    this.#currentLines += chunk.length;
    return { file, chunk };
  }

  private async write(entries: OperationLoggerItem[], sync: boolean = false) {
    while (entries.length > 0) {
      const { file, chunk } = this.takeChunk(entries);
      if (sync) this.#storage.appendSync(file, chunk);
      else await this.#storage.append(file, chunk);
      this.#cache.get(file)?.push(...chunk);
    }
  }

  private takeBuffer() {
    const entries = Array.from(this.#buffer.values());
    this.#buffer.clear();
    return entries;
  }

  private async doFlush() {
    if (this.#buffer.size === 0) return;
    await this.initCurrentFile();
    await this.write(this.takeBuffer());
    await this.runRetention();
  }

  flush(): Promise<void> {
    const next = this.#flushChain.then(() => this.doFlush());
    this.#flushChain = next.catch(() => {});
    return next;
  }

  flushSync() {
    if (this.#buffer.size === 0) return;
    try {
      this.write(this.takeBuffer(), true);
    } catch {}
  }

  checkBufferQueue() {
    if (this.#buffer.size < this.#bufferSize) return;
    this.flush().catch(() => {});
  }

  log<T extends keyof OperationLoggerItemPayload>(
    type: T,
    payload: CleanPayload<T>,
    level: "info" | "warning" | "error" = "info",
    force = false
  ) {
    if (!force && !this.enabled) return "";
    if (!force && !isCategoryEnabled(type)) return "";

    const operation_id = v4();
    const item = {
      type,
      operation_id,
      operation_time: Date.now().toString(),
      operation_level: level,
      ...payload
    } as unknown as OperationLoggerItem & { daemon_id?: string; daemon_name?: string };

    if (item.daemon_id && !item.daemon_name) {
      item.daemon_name = RemoteServiceSubsystem.getInstance(item.daemon_id)?.config?.remarks;
    }

    this.#buffer.set(operation_id, item);
    this.checkBufferQueue();
    return operation_id;
  }

  private async readAllEntries() {
    const result: OperationLoggerItem[] = [];
    for (const file of this.files()) {
      result.push(...(await this.read(file)));
    }
    return result;
  }

  async get(limit = 20) {
    await this.flush();
    return (await this.readAllEntries()).slice(-limit);
  }

  async search(query: OperationLoggerQuery): Promise<OperationLoggerQueryResult> {
    await this.flush();
    const all = await this.readAllEntries();
    const type = query.type?.trim();
    const level = query.level?.trim();
    const operator = query.operatorName?.trim().toLowerCase();
    const keyword = query.keyword?.trim().toLowerCase();
    const startTime = Number(query.startTime) || 0;
    const endTime = Number(query.endTime) || 0;

    // Newest first
    const filtered = all.reverse().filter((item) => {
      if (type && item.type !== type) return false;
      if (level && item.operation_level !== level) return false;
      if (operator && !(item.operator_name ?? "").toLowerCase().includes(operator)) return false;
      const time = Number(item.operation_time);
      if (startTime > 0 && time < startTime) return false;
      if (endTime > 0 && time > endTime) return false;
      if (keyword && !JSON.stringify(item).toLowerCase().includes(keyword)) return false;
      return true;
    });

    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20));
    const total = filtered.length;
    const maxPage = Math.max(1, Math.ceil(total / pageSize));
    const page = Math.min(maxPage, Math.max(1, Number(query.page) || 1));
    return {
      page,
      pageSize,
      maxPage,
      total,
      data: filtered.slice((page - 1) * pageSize, page * pageSize)
    };
  }

  private async remove(file: string) {
    this.#cache.delete(file);
    await this.#storage.clear(file);
  }

  async runRetention() {
    try {
      await this.pruneFiles();
    } catch {}
  }

  private async pruneFiles() {
    const keepDays = Number(systemConfig?.operationLogKeepDays) || 0;
    if (keepDays > 0) {
      const cutoff = toDate(Date.now() - (keepDays - 1) * DAY_MS);
      for (const file of this.files()) {
        if (!SEGMENT_REGEX.test(file)) continue;
        if (file.slice(0, 10) >= cutoff) break;
        await this.remove(file);
      }
    }

    const maxTotalLines = Number(systemConfig?.operationLogMaxTotalLines) || 0;
    if (maxTotalLines <= 0) return;
    const files = this.files();
    const counts = await Promise.all(files.map(async (file) => (await this.read(file)).length));
    let total = counts.reduce((sum, count) => sum + count, 0);
    for (let i = 0; i < files.length && total > maxTotalLines; i++) {
      if (files[i] === this.#currentFile) break;
      total -= counts[i];
      await this.remove(files[i]);
    }
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

  private startFlushTimer() {
    this.#flushTimer = setInterval(() => this.flush().catch(() => {}), 5000);
  }

  public stopFlushTimer() {
    if (!this.#flushTimer) return;
    clearInterval(this.#flushTimer);
    this.#flushTimer = null;
  }
}

export const operationLogger = new OperationLogger();

process.on("SIGINT", () => {
  operationLogger.stopFlushTimer();
  operationLogger.flushSync();
});

process.on("exit", () => {
  operationLogger.stopFlushTimer();
  operationLogger.flushSync();
});
