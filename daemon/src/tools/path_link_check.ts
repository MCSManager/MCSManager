import fs from "fs-extra";

/**
 * If the path is a symbolic link, resolves and returns the real path it points to.
 * Returns null if the path is not a symbolic link or resolution fails.
 */
export function resolveLink(absolutePath: string): string | null {
  try {
    if (!fs.lstatSync(absolutePath).isSymbolicLink()) return null;
    return fs.realpathSync(absolutePath);
  } catch {
    return null;
  }
}
