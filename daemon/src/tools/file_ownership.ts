import fs from "fs-extra";
import path from "path";
import type Instance from "../entity/instance/instance";
import { $t } from "../i18n";
import { getLinuxSystemId } from "./system_user";

export interface FileOwnership {
  uid: number;
  gid: number;
}

function isInside(root: string, target: string): boolean {
  const relative = path.relative(root, target);
  return (
    relative === "" ||
    (!path.isAbsolute(relative) && relative !== ".." && !relative.startsWith(".." + path.sep))
  );
}

function parseId(value: string, label: string): number {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 0 || id >= 0xffffffff) {
    throw new Error($t("TXT_CODE_file_ownership.invalidId", { label }));
  }
  return id;
}

export async function resolveInstanceFileOwnership(
  instance: Instance
): Promise<FileOwnership | undefined> {
  if (process.platform === "win32") return undefined;

  const runAs = String(instance.config.runAs || "").trim();
  if (!runAs) return undefined;

  const numericIds = runAs.match(/^(\d+):(\d+)$/);
  if (numericIds) {
    return {
      uid: parseId(numericIds[1], "UID"),
      gid: parseId(numericIds[2], "GID")
    };
  }

  // Docker accepts forms such as a numeric UID or user:group, but the Daemon
  // cannot determine their container-side primary GID from the host.
  if (/^\d+$/.test(runAs) || runAs.includes(":")) return undefined;

  try {
    return await getLinuxSystemId(runAs);
  } catch {
    // Keep file operations working when runAs itself cannot be resolved.
    return undefined;
  }
}

export async function syncPathOwnershipWithinRoot(
  workspaceRoot: string,
  target: string,
  ownership: FileOwnership
): Promise<void> {
  const rootPath = path.resolve(workspaceRoot);
  const targetPath = path.resolve(target);
  if (!isInside(rootPath, targetPath)) {
    throw new Error($t("TXT_CODE_file_ownership.invalidTarget"));
  }

  const rootRealPath = await fs.realpath(rootPath);
  const targetInfo = await fs.lstat(targetPath);
  const pathToValidate = targetInfo.isSymbolicLink() ? path.dirname(targetPath) : targetPath;
  const targetRealPath = await fs.realpath(pathToValidate);
  if (!isInside(rootRealPath, targetRealPath)) {
    throw new Error($t("TXT_CODE_file_ownership.outsideWorkspace"));
  }

  await fs.lchown(targetPath, ownership.uid, ownership.gid);
}

export async function syncInstancePathOwnership(
  instance: Instance,
  target: string,
  ownership?: FileOwnership
): Promise<void> {
  const resolvedOwnership = ownership ?? (await resolveInstanceFileOwnership(instance));
  if (!resolvedOwnership) return;
  await syncPathOwnershipWithinRoot(instance.absoluteCwdPath(), target, resolvedOwnership);
}
