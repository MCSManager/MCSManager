import fs from "fs-extra";
import path from "path";
import { $t } from "../i18n";
import type { FileOwnership } from "../tools/file_ownership";
import { syncPathOwnershipWithinRoot } from "../tools/file_ownership";
import { resolveRealPath } from "../tools/path_link_check";
import FileManager from "./system_file";

function isInside(root: string, target: string): boolean {
  const relative = path.relative(root, target);
  return (
    relative === "" ||
    (!path.isAbsolute(relative) && relative !== ".." && !relative.startsWith(".." + path.sep))
  );
}

export async function prepareRootlessBindSource(
  workspace: string,
  source: string,
  ownership: FileOwnership
): Promise<void> {
  // Reject ambiguous paths before normalization can erase symlink/.. semantics.
  if (!path.isAbsolute(source) || source.split(path.sep).includes("..")) {
    throw new Error($t("TXT_CODE_file_ownership.invalidTarget"));
  }
  const rootPath = path.resolve(workspace);
  const sourcePath = path.resolve(source);
  if (!isInside(rootPath, sourcePath)) {
    // Arbitrary administrator-provided binds are not instance-managed data.
    // Never create them or change their ownership, including through aliases.
    try {
      await fs.realpath(sourcePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        throw new Error($t("TXT_CODE_rootless.externalBindMissing"));
      }
      throw error;
    }
    return;
  }

  const realRoot = await fs.realpath(rootPath);
  const physicalSource = resolveRealPath(sourcePath);
  if (!physicalSource || !isInside(realRoot, physicalSource)) {
    throw new Error($t("TXT_CODE_file_ownership.outsideWorkspace"));
  }
  const files = new FileManager(realRoot, undefined, async () => ownership);
  let sourceInfo: fs.Stats | undefined;
  try {
    sourceInfo = await fs.lstat(physicalSource);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  if (!sourceInfo || sourceInfo.isDirectory()) {
    await files.mkdir(physicalSource);
  } else {
    await files.syncOwnership(physicalSource, ownership);
  }
  if (physicalSource === realRoot) {
    await syncPathOwnershipWithinRoot(realRoot, realRoot, ownership);
  }
  if ((await fs.realpath(sourcePath)) !== physicalSource) {
    throw new Error($t("TXT_CODE_file_ownership.targetChanged"));
  }
}
