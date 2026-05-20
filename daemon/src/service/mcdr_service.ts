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
    return path.isAbsolute(dir)
      ? path.normalize(dir)
      : path.normalize(path.join(instanceCwd, dir.trim()));
  } catch {
    return null;
  }
}
