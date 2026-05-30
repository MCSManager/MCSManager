import fs from "fs-extra";

/**
 * Returns true when the path itself is a symbolic link (does not follow the link).
 */
export function isSymbolicLinkPath(absolutePath: string): boolean {
  try {
    return fs.lstatSync(absolutePath).isSymbolicLink();
  } catch {
    return false;
  }
}

/**
 * Returns true when the path is a hard link to an existing file.
 * Directories are excluded because nlink is not meaningful for them across platforms.
 */
export function isHardLinkPath(absolutePath: string): boolean {
  try {
    const stat = fs.statSync(absolutePath);
    return stat.isFile() && stat.nlink > 1;
  } catch {
    return false;
  }
}

/**
 * Returns true when the path is a symbolic link or a hard link.
 */
export function isFileSystemLink(absolutePath: string): boolean {
  return isSymbolicLinkPath(absolutePath) || isHardLinkPath(absolutePath);
}
