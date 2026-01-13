import { ChildProcess, spawn } from "child_process";
import fs from "fs-extra";
import { t } from "i18next";
import { ProcessWrapper } from "mcsmanager-common";
import path from "path";
import { GOLANG_ZIP_PATH, SEVEN_ZIP_PATH, ZIP_TIMEOUT_SECONDS } from "../const";
import { $t } from "../i18n";
import logger from "../service/log";
import {
  check7zipStatus,
  getFileExtension,
  isMultiVolume,
  isZipFormat
} from "../service/seven_zip_service";

const COMPRESS_ERROR_MSG = {
  invalidName: t("TXT_CODE_3aa9f36"),
  exitErr: t("TXT_CODE_2be83d36"),
  startErr: t("TXT_CODE_37d839a4"),
  timeoutErr: t("TXT_CODE_15c07350")
};

function checkFileName(fileName: string) {
  const disableList = ['"', "'", "?", "|", "&"];
  for (const iterator of disableList) {
    if (fileName.includes(iterator)) return false;
  }
  return true;
}

export async function compress(
  sourceZip: string,
  files: string[],
  fileCode?: string
): Promise<boolean> {
  if (!checkFileName(sourceZip) || files.some((v) => !checkFileName(v)))
    throw new Error(COMPRESS_ERROR_MSG.invalidName);
  return await useZip(sourceZip, files, fileCode);
}

export async function decompress(
  zipPath: string,
  dest: string,
  fileCode?: string,
  options?: { onStart?: (child: ChildProcess | null) => void }
): Promise<boolean> {
  if (!checkFileName(zipPath) || !checkFileName(dest))
    throw new Error(COMPRESS_ERROR_MSG.invalidName);

  const tryUnzip = async () => {
    if (!isZipFormat(zipPath)) {
      const fileExt = getFileExtension(zipPath);
      throw new Error($t("TXT_CODE_69c42450", { fileExt: fileExt }));
    }

    if (isMultiVolume(zipPath)) {
      throw new Error($t("TXT_CODE_91d066aa"));
    }
    try {
      return await useUnzip(zipPath, dest, fileCode || "utf-8", options);
    } catch (error: any) {
      logger.error($t("TXT_CODE_842929d0", { message: error.message }));
      throw new Error(
        $t("TXT_CODE_f0512848", {
          message: error?.message
        })
      );
    }
  };

  if (!check7zipStatus()) {
    try {
      return await use7zip(zipPath, dest, options);
    } catch (error) {
      // if 7zip is not working, try to use unzip
      return await tryUnzip();
    }
  } else {
    return await tryUnzip();
  }
}

/**
 * Decompress using 7zip
 */
async function use7zip(
  sourceZip: string,
  destDir: string,
  options?: { onStart?: (child: ChildProcess | null) => void }
): Promise<boolean> {
  await fs.ensureDir(destDir);
  const sourceDir = path.dirname(sourceZip);
  logger.info($t("TXT_CODE_35d2ee7a", { command: `${SEVEN_ZIP_PATH} x ${sourceZip}` }));

  return await new Promise<boolean>((resolve, reject) => {
    const child = spawn(SEVEN_ZIP_PATH, ["x", sourceZip, `-o${destDir}`, "-aoa"], {
      cwd: sourceDir,
      windowsHide: true
    });

    options?.onStart?.(child);

    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error($t("TXT_CODE_15c07350")));
    }, ZIP_TIMEOUT_SECONDS * 1000);

    child.stdout?.on("data", (data) => (stdout += data.toString()));
    child.stderr?.on("data", (data) => (stderr += data.toString()));
    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        const msg = stderr || stdout || $t("TXT_CODE_4fb3fad1");
        return reject(new Error(msg));
      }

      const hasErrors =
        stdout.includes("ERRORS:") ||
        stdout.includes("ERROR:") ||
        stdout.includes("Open Errors:") ||
        stdout.includes("Missing volume") ||
        stdout.includes("Data Error") ||
        stdout.includes("Archives with Errors:");

      if (hasErrors) {
        const errorLines = stdout
          .split("\n")
          .filter(
            (line) =>
              line.includes("ERROR") ||
              line.includes("Missing volume") ||
              line.includes("Data Error") ||
              line.includes("Open Errors") ||
              line.includes("Archives with Errors")
          );

        let cleanErrorMsg: string;
        if (stdout.includes("Missing volume")) {
          const volumeMatch = stdout.match(/Missing volume\s*:\s*([^\s\n]+)/);
          cleanErrorMsg = volumeMatch
            ? $t("TXT_CODE_c0401ba7", { file: volumeMatch[1] })
            : $t("TXT_CODE_908a4ace");
        } else if (stdout.includes("Data Error")) {
          cleanErrorMsg = $t("TXT_CODE_b1ef1d4a");
        } else if (stdout.includes("Open Errors")) {
          cleanErrorMsg = $t("TXT_CODE_5778848e");
        } else {
          const firstError = errorLines[0]?.trim() || $t("TXT_CODE_11ecd5a9");
          cleanErrorMsg =
            firstError.length > 100 ? firstError.substring(0, 100) + "..." : firstError;
        }

        logger.error($t("TXT_CODE_cacd8840", { message: cleanErrorMsg }));
        return reject(new Error($t("TXT_CODE_ec7fc405", { message: cleanErrorMsg })));
      }

      if (stderr && stderr.trim()) {
        logger.warn($t("TXT_CODE_8a9c6364", { warning: stderr }));
      }

      if (stdout.includes("Everything is Ok")) {
        logger.info($t("TXT_CODE_e96a91cd"));
      } else {
        const resultLines = stdout
          .split("\n")
          .filter((line) => line.trim())
          .slice(-3);
        logger.info($t("TXT_CODE_143db7d9", { result: resultLines.join("; ") }));
      }
      resolve(true);
    });
  }).catch((error: any) => {
    let simpleErrorMsg: string;
    if (String(error.message || error).includes("Missing volume")) {
      const volumeMatch = String(error.message || error).match(/Missing volume\s*:\s*([^\s\n]+)/);
      simpleErrorMsg = volumeMatch
        ? $t("TXT_CODE_c0401ba7", { file: volumeMatch[1] })
        : $t("TXT_CODE_908a4ace");
    } else if (String(error.message || error).includes("timeout")) {
      simpleErrorMsg = $t("TXT_CODE_1d1ec400");
    } else if (String(error.message || error).includes("ENOENT")) {
      simpleErrorMsg = $t("TXT_CODE_a0ede210");
    } else if (String(error.message || error).includes("Command failed")) {
      simpleErrorMsg = $t("TXT_CODE_4fb3fad1");
    } else {
      simpleErrorMsg = $t("TXT_CODE_f460677f");
    }

    logger.error(
      $t("TXT_CODE_1b688710", {
        message: simpleErrorMsg,
        details: String(error.message || error).substring(0, 200)
      })
    );
    throw new Error($t("TXT_CODE_ec7fc405", { message: simpleErrorMsg }));
  });
}

// ./file-zip -mode 2 --zipPath aaa.zip --DistDirPath 123412124 --code GBK
async function useUnzip(
  sourceZip: string,
  destDir: string,
  code = "utf-8",
  options?: { onStart?: (child: ChildProcess | null) => void }
): Promise<boolean> {
  const params = [
    "--mode=2",
    `--zipPath=${path.basename(sourceZip)}`,
    `--distDirPath=${path.normalize(destDir)}`,
    `--code=${code}`
  ];
  logger.info(`Function useUnzip(): Command: ${GOLANG_ZIP_PATH} ${params.join(" ")}`);
  const subProcess = new ProcessWrapper(
    GOLANG_ZIP_PATH,
    params,
    path.dirname(sourceZip),
    ZIP_TIMEOUT_SECONDS,
    code
  );
  subProcess.setErrMsg(COMPRESS_ERROR_MSG);
  subProcess.on("start", () => options?.onStart?.(subProcess.process ?? null));
  return subProcess.start();
}

// ./file-zip -mode 1 --file main.go --file file-zip --file 123 --file README.md --zipPath aaabb.zip
async function useZip(distZip: string, files: string[], code = "utf-8"): Promise<boolean> {
  if (!files || files.length == 0) throw new Error(t("TXT_CODE_2038ec2c"));
  const params = ["--mode=1", `--code=${code}`, `--zipPath=${path.basename(distZip)}`];
  files.forEach((v) => {
    params.push(`--file=${path.basename(v)}`);
  });
  logger.info(
    `Function useZip(): Command: ${GOLANG_ZIP_PATH} ${params.join(" ")}, CWD: ${path.dirname(
      distZip
    )}`
  );
  const subProcess = new ProcessWrapper(
    GOLANG_ZIP_PATH,
    params,
    path.dirname(distZip),
    ZIP_TIMEOUT_SECONDS,
    code
  );
  subProcess.setErrMsg(COMPRESS_ERROR_MSG);
  return subProcess.start();
}
