import fs from "fs";
import path from "path";
import type { Stats } from "fs";
import { $t } from "../i18n";
import { resolvePhysicalPath } from "./path_link_check";

interface FileTarget {
  path: string;
  identity?: Pick<Stats, "dev" | "ino">;
}

interface ActiveWrite extends FileTarget {
  workspace: string;
}

interface ActiveOperation {
  workspace: string;
  targets: FileTarget[];
}

export interface FileWriteReservation {
  updateIdentity: (identity: Stats) => void;
  release: () => void;
}

const activeWrites = new Set<ActiveWrite>();
const activeOperations = new Set<ActiveOperation>();

function contains(parent: string, child: string): boolean {
  const relative = path.relative(parent, child);
  return (
    relative === "" ||
    (!path.isAbsolute(relative) && relative !== ".." && !relative.startsWith(".." + path.sep))
  );
}

function overlaps(first: string, second: string): boolean {
  return contains(first, second) || contains(second, first);
}

function sameInode(first: FileTarget, second: FileTarget): boolean {
  return Boolean(
    first.identity &&
      second.identity &&
      first.identity.dev === second.identity.dev &&
      first.identity.ino === second.identity.ino
  );
}

function readTarget(target: string): FileTarget {
  const physical = resolvePhysicalPath(target);
  if (!physical) throw new Error($t("TXT_CODE_file_ownership.invalidTarget"));
  let identity: Stats | undefined;
  try {
    identity = fs.statSync(target);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  return { path: physical, identity };
}

function conflict(): never {
  throw new Error($t("TXT_CODE_file_task.activeWrite"));
}

/** One-shot guard for legacy paths; Rootless mutations hold lifecycle reservations. */
export function assertFileAvailable(target: string): void {
  if (activeWrites.size === 0 && activeOperations.size === 0) return;
  const candidate = readTarget(target);
  for (const active of activeWrites)
    if (overlaps(candidate.path, active.path) || sameInode(candidate, active)) conflict();
  for (const operation of activeOperations)
    if (
      overlaps(candidate.path, operation.workspace) ||
      operation.targets.some((entry) => sameInode(candidate, entry))
    )
      conflict();
}

/** Shared workspace access: different files may be written concurrently. */
export function reserveFileWrite(workspace: string, target: string): FileWriteReservation {
  const active: ActiveWrite = { ...readTarget(target), workspace: readTarget(workspace).path };
  const assertAvailable = () => {
    for (const writer of activeWrites) {
      if (writer !== active && (overlaps(active.path, writer.path) || sameInode(active, writer)))
        conflict();
    }
    for (const operation of activeOperations) {
      if (
        overlaps(active.workspace, operation.workspace) ||
        operation.targets.some((entry) => sameInode(active, entry))
      )
        conflict();
    }
  };
  assertAvailable();
  activeWrites.add(active);
  return {
    updateIdentity(identity) {
      if (!activeWrites.has(active)) throw new Error($t("TXT_CODE_file_ownership.targetChanged"));
      active.identity = identity;
      assertAvailable();
    },
    release() {
      activeWrites.delete(active);
    }
  };
}

/**
 * Exclusive workspace access avoids retaining every descendant inode during a
 * recursive operation. Check-and-insert is synchronous; conflicts are not queued.
 */
export function reserveFileOperation(workspace: string, targets: string[]): () => void {
  const operation = { workspace: readTarget(workspace).path, targets: targets.map(readTarget) };
  for (const active of activeOperations)
    if (
      overlaps(operation.workspace, active.workspace) ||
      operation.targets.some((entry) => active.targets.some((other) => sameInode(entry, other)))
    )
      conflict();
  for (const writer of activeWrites)
    if (
      overlaps(operation.workspace, writer.workspace) ||
      operation.targets.some((entry) => sameInode(entry, writer))
    )
      conflict();
  activeOperations.add(operation);
  return () => {
    activeOperations.delete(operation);
  };
}
