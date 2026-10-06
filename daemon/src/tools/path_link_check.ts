import fs from "fs-extra";
import os from "os";
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

function splitSegments(p: string): string[] {
  return p.split(os.platform() === "win32" ? /[\\/]/ : path.sep).filter((s) => s.length > 0);
}

// readlink/junction targets may carry the Win32 extended-length prefix, which
// would otherwise defeat root parsing and prefix comparison.
function stripExtendedPrefix(p: string): string {
  if (p.startsWith("\\\\?\\UNC\\")) return "\\\\" + p.slice(8);
  if (p.startsWith("\\\\?\\")) return p.slice(4);
  return p;
}

/**
 * Resolves an absolute path the way the kernel does: no lexical pre-processing.
 * Every component is lstat-ed in order and symbolic links are expanded in place, so a
 * following '..' applies to the directory the link resolved to — whereas
 * path.resolve()/path.normalize() collapse '..' textually and never observe the link.
 * Returns null for relative input or a cyclic/unreadable link chain (callers fail closed).
 */
export function resolvePhysicalPath(absolutePath: string, maxLinks = 40): string | null {
  const input = stripExtendedPrefix(absolutePath);
  if (!path.isAbsolute(input)) return null;
  const root = path.parse(input).root;
  const queue = splitSegments(input.slice(root.length));
  const resolved: string[] = [];
  let links = 0;
  for (let i = 0; i < queue.length; i++) {
    const seg = queue[i];
    if (seg === ".") continue;
    if (seg === "..") {
      resolved.pop();
      continue;
    }
    resolved.push(seg);
    const candidate = path.join(root, ...resolved);
    let st;
    try {
      st = fs.lstatSync(candidate);
    } catch {
      continue;
    }
    if (!st.isSymbolicLink()) continue;
    if (++links > maxLinks) return null;
    let target: string;
    try {
      target = fs.readlinkSync(candidate);
    } catch {
      return null;
    }
    resolved.pop();
    target = stripExtendedPrefix(target);
    if (path.isAbsolute(target)) {
      const physicalTarget = resolvePhysicalPath(target, maxLinks - links);
      if (!physicalTarget) return null;
      resolved.length = 0;
      resolved.push(...splitSegments(physicalTarget.slice(path.parse(physicalTarget).root.length)));
    } else {
      queue.splice(i + 1, 0, ...splitSegments(target));
    }
  }
  return path.join(root, ...resolved);
}
