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
    const resolved = path.isAbsolute(dir)
      ? path.normalize(dir)
      : path.normalize(path.join(instanceCwd, dir.trim()));
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
