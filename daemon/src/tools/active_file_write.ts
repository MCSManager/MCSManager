import fs from "fs";
import path from "path";
import type { Stats } from "fs";
import { $t } from "../i18n";
import { resolvePhysicalPath } from "./path_link_check";

interface ActiveWrite {
  path: string;
  identity?: Pick<Stats, "dev" | "ino">;
}

const activeWrites = new Set<ActiveWrite>();

function contains(parent: string, child: string): boolean {
  const relative = path.relative(parent, child);
  return (
    relative === "" ||
    (!path.isAbsolute(relative) && relative !== ".." && !relative.startsWith(".." + path.sep))
  );
}

/** Protect aliases, hard links and ancestor directories of in-flight writes. */
export function assertNoActiveFileWrite(target: string): void {
  if (activeWrites.size === 0) return;
  const physical = resolvePhysicalPath(target);
  let identity: Stats | undefined;
  try {
    identity = fs.statSync(target);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  for (const active of activeWrites) {
    if (
      (physical && contains(physical, active.path)) ||
      (identity &&
        active.identity &&
        identity.dev === active.identity.dev &&
        identity.ino === active.identity.ino)
    )
      throw new Error($t("TXT_CODE_file_task.activeWrite"));
  }
}

/** Reservations live only as long as the owned descriptor, never per chunk. */
export function reserveFileWrite(target: string, identity?: Stats): () => void {
  assertNoActiveFileWrite(target);
  const active = { path: target, identity };
  activeWrites.add(active);
  return () => {
    activeWrites.delete(active);
  };
}
