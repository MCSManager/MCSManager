import { exec } from "child_process";
import { existsSync } from "fs";
import fs from "fs/promises";
import path from "path";
import { promisify } from "util";
import { SEVEN_ZIP_PATH } from "../const";
import { $t } from "../i18n";
import logger from "./log";

const execPromise = promisify(exec);

/**
 * Check if the file is in zip format (only supports .zip extension)
 */
export function isZipFormat(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return ext === ".zip";
}

/**
 * Check if it's a multi-volume archive (supports ZIP, 7z, RAR formats)
 * ZIP multi-volume naming: archive.zip, archive.z01, archive.z02, etc.
 * 7z multi-volume naming: archive.7z.001, archive.7z.002, etc.
 * RAR multi-volume naming: archive.part1.rar, archive.part2.rar or archive.rar, archive.r00, archive.r01, etc.
 */
export function isMultiVolume(filePath: string): boolean {
  const dir = path.dirname(filePath);
  const fullName = path.basename(filePath);
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".zip") {
    const baseName = path.basename(filePath, ".zip");
    const firstVolumeFile = path.join(dir, baseName + ".z01");
    return existsSync(firstVolumeFile);
  }

  if (ext === ".7z") {
    const baseName = path.basename(filePath, ".7z");
    const firstVolumeFile = path.join(dir, baseName + ".7z.001");
    return existsSync(firstVolumeFile);
  }

  if (ext === ".rar") {
    const baseName = path.basename(filePath, ".rar");

    if (fullName.includes(".part1.rar")) {
      const partBaseName = fullName.replace(".part1.rar", "");
      const secondPartFile = path.join(dir, partBaseName + ".part2.rar");
      return existsSync(secondPartFile);
    }

    const firstVolumeFile = path.join(dir, baseName + ".r00");
    return existsSync(firstVolumeFile);
  }

  return false;
}

/**
 * Get file extension for error messages
 */
export function getFileExtension(filePath: string): string {
  return path.extname(filePath).toLowerCase().substring(1) || "unknown";
}

let isChecked7zip = false;
/**
 * Check if 7zip is working properly
 */
export async function check7zipStatus(): Promise<boolean> {
  try {
    if (isChecked7zip) return true;
    if (!existsSync(SEVEN_ZIP_PATH)) return false;
    try {
      await fs.chmod(SEVEN_ZIP_PATH, 0o755);
    } catch (chmodError: any) {
      logger.warn($t("TXT_CODE_9ade0fb8", { message: chmodError.message }));
    }
    const { stdout } = await execPromise(`"${SEVEN_ZIP_PATH}" i`, {
      timeout: 5 * 1000
    });
    if (stdout.includes("7-Zip") && stdout.includes("Copyright")) {
      logger.info($t("TXT_CODE_a7c73a51", { info: stdout.split("\n")[1].trim() }));
      isChecked7zip = true;
      return true;
    }
    return false;
  } catch (error: any) {
    // ignore error
    return false;
  }
}
