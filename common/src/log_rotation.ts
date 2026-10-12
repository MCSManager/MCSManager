import fs from "fs-extra";
import os from "os";
import path from "path";
import zlib from "zlib";

export const MAX_LOG_SIZE = 10 * 1024 * 1024;
export const LOG_RETENTION_DAYS = 30;
export const LOG_FILE_MODE = 0o700;
export const LOG_DIR_MODE = 0o700;

const DAY_MS = 24 * 60 * 60 * 1000;

export type LogRotationWarn = (message: string) => void;

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function formatLogTimestamp(date: Date): string {
  return (
    `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}` +
    `_${pad2(date.getHours())}-${pad2(date.getMinutes())}-${pad2(date.getSeconds())}`
  );
}

export function restrictPermission(
  target: string,
  onWarn?: LogRotationWarn,
  mode: number = LOG_FILE_MODE
): void {
  try {
    fs.chmodSync(target, mode);
  } catch (error) {
    onWarn?.(`Failed to restrict permissions of ${target}: ${describeError(error)}`);
  }
}

export function ensureLogDir(dir: string, onWarn?: LogRotationWarn): void {
  try {
    fs.mkdirsSync(dir);
  } catch (error) {
    onWarn?.(`Failed to create log directory ${dir}: ${describeError(error)}`);
    return;
  }
  restrictPermission(dir, onWarn, LOG_DIR_MODE);
}

function uniqueArchiveStem(dir: string, base: string, stamp: string): string {
  let stem = `${base}_${stamp}`;
  for (let n = 1; ; n++) {
    const clash =
      fs.existsSync(path.join(dir, `${stem}.log`)) ||
      fs.existsSync(path.join(dir, `${stem}.log.gz`));
    if (!clash) return stem;
    stem = `${base}_${stamp}_${pad2(n)}`;
  }
}

export function archiveLogFile(
  filePath: string,
  onWarn?: LogRotationWarn,
  now: Date = new Date()
): string | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    const dir = path.dirname(filePath);
    const base = path.parse(filePath).name;
    const stem = uniqueArchiveStem(dir, base, formatLogTimestamp(now));
    const intermediate = path.join(dir, `${stem}.log`);
    const archivePath = path.join(dir, `${stem}.log.gz`);
    fs.renameSync(filePath, intermediate);
    fs.writeFileSync(archivePath, zlib.gzipSync(fs.readFileSync(intermediate)), {
      mode: LOG_FILE_MODE
    });
    fs.unlinkSync(intermediate);
    restrictPermission(archivePath, onWarn);
    return archivePath;
  } catch (error) {
    onWarn?.(`Failed to archive log file ${filePath}: ${describeError(error)}`);
    return null;
  }
}

function isLogArtifact(name: string): boolean {
  return name.endsWith(".log") || name.endsWith(".log.gz");
}

function readLogDir(logsDir: string, onWarn?: LogRotationWarn): string[] {
  try {
    return fs.readdirSync(logsDir);
  } catch (error) {
    onWarn?.(`Failed to read log directory ${logsDir}: ${describeError(error)}`);
    return [];
  }
}

export function compressPlainArchives(
  logsDir: string,
  activeNames: string[],
  onWarn?: LogRotationWarn
): void {
  for (const name of readLogDir(logsDir, onWarn)) {
    if (activeNames.includes(name) || !name.endsWith(".log")) continue;
    const source = path.join(logsDir, name);
    try {
      if (!fs.statSync(source).isFile()) continue;
      const target = `${source}.gz`;
      fs.writeFileSync(target, zlib.gzipSync(fs.readFileSync(source)), { mode: LOG_FILE_MODE });
      fs.unlinkSync(source);
      restrictPermission(target, onWarn);
    } catch (error) {
      onWarn?.(`Failed to compress log archive ${source}: ${describeError(error)}`);
    }
  }
}

export function pruneOldLogs(
  logsDir: string,
  activeNames: string[],
  onWarn?: LogRotationWarn
): void {
  const cutoff = Date.now() - LOG_RETENTION_DAYS * DAY_MS;
  for (const name of readLogDir(logsDir, onWarn)) {
    if (activeNames.includes(name) || !isLogArtifact(name)) continue;
    const target = path.join(logsDir, name);
    try {
      const stat = fs.statSync(target);
      if (stat.isFile() && stat.mtimeMs < cutoff) fs.unlinkSync(target);
    } catch (error) {
      onWarn?.(`Failed to prune log archive ${target}: ${describeError(error)}`);
    }
  }
}

function restrictLogArtifacts(
  logsDir: string,
  activeNames: string[],
  onWarn?: LogRotationWarn
): void {
  for (const name of readLogDir(logsDir, onWarn)) {
    if (activeNames.includes(name) || !isLogArtifact(name)) continue;
    restrictPermission(path.join(logsDir, name), onWarn);
  }
}

export function runLogMaintenance(
  logsDir: string,
  activeNames: string[],
  onWarn?: LogRotationWarn
): void {
  ensureLogDir(logsDir, onWarn);
  for (const name of activeNames) {
    archiveLogFile(path.join(logsDir, name), onWarn);
  }
  compressPlainArchives(logsDir, activeNames, onWarn);
  restrictLogArtifacts(logsDir, activeNames, onWarn);
  pruneOldLogs(logsDir, activeNames, onWarn);
}

export interface RotatingAppenderConfig {
  filename: string;
  maxLogSize?: number;
  activeNames?: string[];
  layout?: { type: string; [key: string]: unknown };
  timezoneOffset?: number;
}

export interface LogRotationLayouts {
  basicLayout: (loggingEvent: unknown, timezoneOffset?: number) => string;
  layout: (
    name: string,
    config: unknown
  ) => (loggingEvent: unknown, timezoneOffset?: number) => string;
}

export interface LogEventAppender {
  (loggingEvent: unknown): void;
  shutdown?: (complete?: () => void) => void;
}

export const rotatingFileAppender = {
  configure(config: RotatingAppenderConfig, layouts: LogRotationLayouts): LogEventAppender {
    const filePath = path.normalize(String(config.filename));
    const maxLogSize = Number(config.maxLogSize) > 0 ? Number(config.maxLogSize) : MAX_LOG_SIZE;
    const logsDir = path.dirname(filePath);
    const activeName = path.basename(filePath);
    const activeNames =
      Array.isArray(config.activeNames) && config.activeNames.length > 0
        ? config.activeNames.map((name) => String(name))
        : [activeName];
    const layout = config.layout
      ? layouts.layout(config.layout.type, config.layout)
      : layouts.basicLayout;
    const timezoneOffset = config.timezoneOffset;
    const eol = os.EOL;

    let writtenBytes = 0;

    const appendRaw = (line: string) => {
      fs.appendFileSync(filePath, line, { encoding: "utf8", mode: LOG_FILE_MODE });
    };

    const warn: LogRotationWarn = (message: string) => {
      try {
        appendRaw(`[log-rotation] ${message}${eol}`);
      } catch {}
    };

    const rotate = () => {
      if (archiveLogFile(filePath, warn)) {
        writtenBytes = 0;
        pruneOldLogs(logsDir, activeNames, warn);
      } else {
        try {
          writtenBytes = fs.existsSync(filePath) ? fs.statSync(filePath).size : 0;
        } catch {
          writtenBytes = 0;
        }
      }
    };

    const writeLine = (line: string) => {
      try {
        appendRaw(line);
        writtenBytes += Buffer.byteLength(line, "utf8");
        if (writtenBytes > maxLogSize) rotate();
      } catch (error) {
        warn(`Failed to write to ${filePath}: ${describeError(error)}`);
      }
    };

    ensureLogDir(logsDir, warn);
    try {
      if (fs.existsSync(filePath)) {
        writtenBytes = fs.statSync(filePath).size;
        restrictPermission(filePath, warn);
        if (writtenBytes > maxLogSize) rotate();
      }
    } catch (error) {
      warn(`Failed to inspect ${filePath}: ${describeError(error)}`);
    }

    const app: LogEventAppender = (loggingEvent: unknown) => {
      writeLine(layout(loggingEvent, timezoneOffset) + eol);
    };
    app.shutdown = (complete?: () => void) => {
      if (complete) complete();
    };
    return app;
  }
};
