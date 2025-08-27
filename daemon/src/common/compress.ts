import { exec } from "child_process";
import fs from "fs-extra";
import { t } from "i18next";
import { ProcessWrapper } from "mcsmanager-common";
import path from "path";
import { promisify } from "util";
import { GOLANG_ZIP_PATH, SEVEN_ZIP_PATH, SEVEN_ZIP_STATUS, ZIP_TIMEOUT_SECONDS } from "../const";
import logger from "../service/log";

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
  
  // 如果7zip状态为true，使用7zip解压
  if (SEVEN_ZIP_STATUS) {
    return await use7zip(zipPath, dest);
  } else {
    // 否则使用原来的file_zip
    return await useUnzip(zipPath, dest, fileCode || "utf-8");
  }
}

// 使用7zip进行解压
async function use7zip(sourceZip: string, destDir: string): Promise<boolean> {
  try {
    const sourceDir = path.dirname(sourceZip);
    const normalizedDest = path.normalize(destDir);
    const normalizedSource = path.normalize(sourceDir);
    
    let command: string;
    let workingDir: string;
    
    // 判断是解压到当前目录还是指定目录
    if (normalizedDest === normalizedSource) {
      // 解压到当前目录（压缩包所在目录）
      command = `"${SEVEN_ZIP_PATH}" e "${sourceZip}" -aoa`;
      workingDir = sourceDir;
      logger.info(`使用7zip解压到当前目录: ${command}`);
    } else {
      // 解压到指定目录
      // 确保目标目录存在
      await fs.ensureDir(destDir);
      command = `"${SEVEN_ZIP_PATH}" x "${sourceZip}" "-o${destDir}" -aoa`;
      workingDir = sourceDir;
      logger.info(`使用7zip解压到指定目录: ${command}`);
    }
    
    // 执行7zip命令
    const { stdout, stderr } = await execPromise(command, { 
      cwd: workingDir,
      timeout: ZIP_TIMEOUT_SECONDS * 1000
    });
    
    // 检查输出中是否包含错误信息
    const hasErrors = stdout.includes("ERRORS:") || 
                     stdout.includes("ERROR:") || 
                     stdout.includes("Open Errors:") || 
                     stdout.includes("Missing volume") ||
                     stdout.includes("Data Error") ||
                     stdout.includes("Archives with Errors:");
    
    if (hasErrors) {
      const errorLines = stdout.split('\n').filter(line => 
        line.includes("ERROR") || 
        line.includes("Missing volume") || 
        line.includes("Data Error") ||
        line.includes("Open Errors") ||
        line.includes("Archives with Errors")
      );
      
      // 提取关键错误信息，去除乱码和冗余信息
      let cleanErrorMsg = "";
      if (stdout.includes("Missing volume")) {
        const volumeMatch = stdout.match(/Missing volume\s*:\s*([^\s\n]+)/);
        if (volumeMatch) {
          cleanErrorMsg = `缺少分卷文件: ${volumeMatch[1]}`;
        } else {
          cleanErrorMsg = "缺少分卷文件";
        }
      } else if (stdout.includes("Data Error")) {
        cleanErrorMsg = "压缩包数据损坏";
      } else if (stdout.includes("Open Errors")) {
        cleanErrorMsg = "压缩包无法打开";
      } else {
        // 使用第一个错误信息，但限制长度
        const firstError = errorLines[0]?.trim() || "未知错误";
        cleanErrorMsg = firstError.length > 100 ? firstError.substring(0, 100) + "..." : firstError;
      }
      
      logger.error(`7zip解压出现错误: ${cleanErrorMsg}`);
      throw new Error(`解压失败: ${cleanErrorMsg}`);
    }
    
    if (stderr && stderr.trim()) {
      logger.warn(`7zip解压警告: ${stderr}`);
    }
    
    // 检查是否成功完成
    if (stdout.includes("Everything is Ok")) {
      logger.info(`7zip解压完成: Everything is Ok`);
    } else {
      // 输出最后几行作为结果信息
      const resultLines = stdout.split('\n').filter(line => line.trim()).slice(-3);
      logger.info(`7zip解压完成: ${resultLines.join('; ')}`);
    }
    return true;
    
  } catch (error: any) {
    // 简化错误信息，避免显示完整的命令行
    let simpleErrorMsg = "";
    if (error.message.includes("Missing volume")) {
      const volumeMatch = error.message.match(/Missing volume\s*:\s*([^\s\n]+)/);
      simpleErrorMsg = volumeMatch ? `缺少分卷文件: ${volumeMatch[1]}` : "缺少分卷文件";
    } else if (error.message.includes("timeout")) {
      simpleErrorMsg = "解压超时";
    } else if (error.message.includes("ENOENT")) {
      simpleErrorMsg = "7zip程序未找到";
    } else if (error.message.includes("Command failed")) {
      simpleErrorMsg = "解压过程中出现错误";
    } else {
      simpleErrorMsg = "解压失败";
    }
    
    logger.error(`7zip解压失败: ${simpleErrorMsg} (详细: ${error.message.substring(0, 200)})`);
    throw new Error(`解压失败: ${simpleErrorMsg}`);
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
