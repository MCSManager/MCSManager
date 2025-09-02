import { exec } from "child_process";
import fs from "fs-extra";
import { t } from "i18next";
import { ProcessWrapper } from "mcsmanager-common";
import path from "path";
import { promisify } from "util";
import { GOLANG_ZIP_PATH, SEVEN_ZIP_PATH, ZIP_TIMEOUT_SECONDS } from "../const";
import { $t } from "../i18n";
import logger from "../service/log";
import {
  check7zipStatus,
  getFileExtension,
  isMultiVolume,
  isZipFormat
} from "../service/seven_zip_service";

const execPromise = promisify(exec);

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
  fileCode?: string
): Promise<boolean> {
  if (!checkFileName(zipPath) || !checkFileName(dest))
    throw new Error(COMPRESS_ERROR_MSG.invalidName);

  if (!check7zipStatus()) {
    if (!isZipFormat(zipPath)) {
      const fileExt = getFileExtension(zipPath);
      throw new Error(
        $t("缺少 7zip 依赖库支持，暂无法解压 {{fileExt}} 格式文件。", { fileExt: fileExt })
      );
    }

    if (isMultiVolume(zipPath)) {
      throw new Error(
        $t(
          "7zip未加载，不支持分卷压缩包的解压。分卷压缩包（包括zip、7z、rar等格式）需要启用7zip支持才能正确解压，请联系管理员尝试安装 7zip 依赖库功能。"
        )
      );
    }

    try {
      return await useUnzip(zipPath, dest, fileCode || "utf-8");
    } catch (error: any) {
      logger.error($t("ZIP 解压失败: {{message}}", { message: error.message }));
      throw new Error(
        $t(
          "ZIP文件解压失败。可能的原因：\n1. 文件损坏或密码保护\n2. 如果这是分卷压缩包(zip+z01+z02等)，需要启用7zip支持\n3. 文件格式不正确\n请检查文件或联系管理员启用7zip功能以获得更好的压缩包支持。"
        )
      );
    }
  } else {
    return await use7zip(zipPath, dest);
  }
}

/**
 * Decompress using 7zip
 */
async function use7zip(sourceZip: string, destDir: string): Promise<boolean> {
  try {
    const sourceDir = path.dirname(sourceZip);
    const normalizedDest = path.normalize(destDir);
    const normalizedSource = path.normalize(sourceDir);

    let command: string;
    let workingDir: string;

    if (normalizedDest === normalizedSource) {
      command = `"${SEVEN_ZIP_PATH}" e "${sourceZip}" -aoa`;
      workingDir = sourceDir;
      logger.info($t("使用7zip解压到当前目录: {{command}}", { command }));
    } else {
      await fs.ensureDir(destDir);
      command = `"${SEVEN_ZIP_PATH}" x "${sourceZip}" "-o${destDir}" -aoa`;
      workingDir = sourceDir;
      logger.info($t("使用7zip解压到指定目录: {{command}}", { command }));
    }

    const { stdout, stderr } = await execPromise(command, {
      cwd: workingDir,
      timeout: ZIP_TIMEOUT_SECONDS * 1000
    });

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
        if (volumeMatch) {
          cleanErrorMsg = $t("缺少分卷文件: {{file}}", { file: volumeMatch[1] });
        } else {
          cleanErrorMsg = $t("缺少分卷文件");
        }
      } else if (stdout.includes("Data Error")) {
        cleanErrorMsg = $t("压缩包数据损坏");
      } else if (stdout.includes("Open Errors")) {
        cleanErrorMsg = $t("压缩包无法打开");
      } else {
        const firstError = errorLines[0]?.trim() || $t("未知错误");
        cleanErrorMsg = firstError.length > 100 ? firstError.substring(0, 100) + "..." : firstError;
      }

      logger.error($t("7zip解压出现错误: {{message}}", { message: cleanErrorMsg }));
      throw new Error($t("解压失败: {{message}}", { message: cleanErrorMsg }));
    }

    if (stderr && stderr.trim()) {
      logger.warn($t("7zip解压警告: {{warning}}", { warning: stderr }));
    }

    if (stdout.includes("Everything is Ok")) {
      logger.info($t("7zip解压完成: Everything is Ok"));
    } else {
      const resultLines = stdout
        .split("\n")
        .filter((line) => line.trim())
        .slice(-3);
      logger.info($t("7zip解压完成: {{result}}", { result: resultLines.join("; ") }));
    }
    return true;
  } catch (error: any) {
    let simpleErrorMsg: string;
    if (error.message.includes("Missing volume")) {
      const volumeMatch = error.message.match(/Missing volume\s*:\s*([^\s\n]+)/);
      simpleErrorMsg = volumeMatch
        ? $t("缺少分卷文件: {{file}}", { file: volumeMatch[1] })
        : $t("缺少分卷文件");
    } else if (error.message.includes("timeout")) {
      simpleErrorMsg = $t("解压超时");
    } else if (error.message.includes("ENOENT")) {
      simpleErrorMsg = $t("7zip程序未找到");
    } else if (error.message.includes("Command failed")) {
      simpleErrorMsg = $t("解压过程中出现错误");
    } else {
      simpleErrorMsg = $t("解压失败");
    }

    logger.error(
      $t("7zip解压失败: {{message}} (详细: {{details}})", {
        message: simpleErrorMsg,
        details: error.message.substring(0, 200)
      })
    );
    throw new Error($t("解压失败: {{message}}", { message: simpleErrorMsg }));
  }
}

// ./file-zip -mode 2 --zipPath aaa.zip --DistDirPath 123412124 --code GBK
async function useUnzip(sourceZip: string, destDir: string, code = "utf-8"): Promise<boolean> {
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
