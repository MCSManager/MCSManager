import { execFileSync } from "child_process";
import path from "path";

export function parseLinuxDfOutput(output: string): IMcsmMonitorDiskSnapshot[] {
  const lines = output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length <= 1) return [];

  const disks: IMcsmMonitorDiskSnapshot[] = [];
  for (const line of lines.slice(1)) {
    const parts = line.split(/\s+/);
    if (parts.length < 6) continue;

    const device = parts[0];
    const totalBytes = Number(parts[1]);
    const usedBytes = Number(parts[2]);
    const freeBytes = Number(parts[3]);
    const usagePercent = Number(String(parts[4]).replace("%", ""));
    const mount = parts.slice(5).join(" ");

    if (!Number.isFinite(totalBytes) || !Number.isFinite(usedBytes) || !Number.isFinite(freeBytes)) {
      continue;
    }

    disks.push({
      device,
      mount,
      totalBytes,
      usedBytes,
      freeBytes,
      usagePercent: Number.isFinite(usagePercent)
        ? Number(usagePercent.toFixed(1))
        : Number(((usedBytes / Math.max(totalBytes, 1)) * 100).toFixed(1))
    });
  }

  return disks.sort((left, right) => right.mount.length - left.mount.length);
}

function normalizeMountPath(input: string) {
  const normalized = path.posix.normalize(String(input || "").replace(/\\/g, "/"));
  if (!normalized || normalized === ".") return "";
  if (normalized === "/") return normalized;
  return normalized.replace(/\/+$/, "");
}

function isMountMatch(mount: string, targetPath: string) {
  if (!mount || !targetPath) return false;
  if (mount === "/") return targetPath.startsWith("/");
  return targetPath === mount || targetPath.startsWith(`${mount}/`);
}

export function selectPrimaryDiskForPaths(
  disks: IMcsmMonitorDiskSnapshot[],
  paths: string[]
): IMcsmMonitorDiskSnapshot | undefined {
  if (!disks.length) return undefined;

  const normalizedPaths = paths.map((item) => normalizeMountPath(item)).filter(Boolean);
  if (!normalizedPaths.length) {
    return disks.find((item) => normalizeMountPath(item.mount) === "/") ?? disks[0];
  }

  let bestDisk: IMcsmMonitorDiskSnapshot | undefined;
  let bestCount = -1;
  let bestMountLength = -1;

  for (const disk of disks) {
    const normalizedMount = normalizeMountPath(disk.mount);
    let matchCount = 0;

    for (const targetPath of normalizedPaths) {
      if (isMountMatch(normalizedMount, targetPath)) {
        matchCount++;
      }
    }

    if (
      matchCount > bestCount ||
      (matchCount === bestCount && normalizedMount.length > bestMountLength)
    ) {
      bestDisk = disk;
      bestCount = matchCount;
      bestMountLength = normalizedMount.length;
    }
  }

  if (bestDisk && bestCount > 0) return bestDisk;
  return disks.find((item) => normalizeMountPath(item.mount) === "/") ?? disks[0];
}

export function getLinuxDiskSnapshots() {
  if (process.platform !== "linux") return [];

  try {
    const output = execFileSync("df", ["-B1", "-P"], {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"]
    });
    return parseLinuxDfOutput(output);
  } catch (error) {
    return [];
  }
}
