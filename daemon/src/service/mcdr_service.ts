import fs from "fs-extra";
import path from "path";
import yaml from "yaml";

export const TYPE_MINECRAFT_MCDR = "universal/mcdr";

export function resolveMCDRServerRoot(type: string, instanceCwd: string): string | null {
  if (type !== TYPE_MINECRAFT_MCDR) return null;
  try {
    const raw = fs.readFileSync(path.join(instanceCwd, "config.yml"), "utf-8");
    const dir = yaml.parse(raw)?.working_directory;
    if (typeof dir !== "string" || !dir.trim()) return null;
    const trimmed = dir.trim();
    // On a POSIX host, Windows-style absolute paths ("\", "C:\", "\\server\")
    // are NOT recognized by path.isAbsolute and would be treated as a harmless
    // relative name inside the instance.  Reject them explicitly so the
    // workspace boundary holds regardless of which OS authored config.yml.
    if (!path.isAbsolute(trimmed) && path.win32.isAbsolute(trimmed)) return null;
    const resolved = path.isAbsolute(trimmed)
      ? path.normalize(trimmed)
      : path.normalize(path.join(instanceCwd, trimmed));
    // The resolved directory MUST stay inside the instance workspace.
    // Without this boundary, config.yml can set working_directory to "/" or
    // any absolute path and every FileManager check (isRootTopRath) is
    // bypassed — giving full host filesystem access to a regular user.
    const rel = path.relative(path.normalize(instanceCwd), resolved);
    if (rel === ".." || rel.startsWith(".." + path.sep) || path.isAbsolute(rel)) return null;
    return resolved;
  } catch {
    return null;
  }
}
