import fs from "fs-extra";
import path from "path";

/**
 * Resolves the real absolute path by walking backwards from the target to
 * find the deepest existing ancestor, then calling realpathSync on it and
 * appending the non-existent tail segments.
 *
 * Returns null if realpathSync fails on the existing ancestor.
 */
export function resolveRealPath(absolutePath: string): string | null {
  let dir = path.resolve(absolutePath);
  const root = path.parse(dir).root;
  const missed: string[] = [];

  while (true) {
    try {
      fs.lstatSync(dir);
      try {
        return path.join(fs.realpathSync(dir), ...missed);
      } catch {
        return null;
      }
    } catch {
      if (dir === root) return null;
      missed.unshift(path.basename(dir));
      dir = path.dirname(dir);
    }
  }
}
