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

// 检查文件是否为zip格式（仅支持.zip后缀）
function isZipFormat(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return ext === '.zip';
}

// 检查是否为zip分卷包
function isZipMultiVolume(zipPath: string): boolean {
  const dir = path.dirname(zipPath);
  const baseName = path.basename(zipPath, '.zip');
  
  // 检查是否存在 .z01, .z02 等分卷文件
  const volumeExtensions = ['.z01', '.z02', '.z03', '.z04', '.z05'];
  
  for (const ext of volumeExtensions) {
    const volumeFile = path.join(dir, baseName + ext);
    if (fs.existsSync(volumeFile)) {
      return true; // 发现分卷文件，说明是分卷包
    }
  }
  
  return false; // 没有发现分卷文件，是普通zip文件
}

// 获取文件扩展名用于错误提示
function getFileExtension(filePath: string): string {
  return path.extname(filePath).toLowerCase().substring(1) || 'unknown';
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
  
  // 如果7zip状态为false，只支持zip格式解压
  if (!SEVEN_ZIP_STATUS) {
    if (!isZipFormat(zipPath)) {
      const fileExt = getFileExtension(zipPath);
      throw new Error(`7zip未加载，不支持 .${fileExt} 格式的解压。请联系管理员启用7zip支持或使用 .zip 格式的压缩包。`);
    }
    
    // 检查是否为zip分卷包
    if (isZipMultiVolume(zipPath)) {
      throw new Error('7zip未加载，不支持zip分卷包的解压。zip分卷包需要启用7zip支持才能正确解压，请联系管理员启用7zip功能。');
    }
    
    // 使用原来的file_zip处理普通zip文件，添加友好的错误处理
    try {
      return await useUnzip(zipPath, dest, fileCode || "utf-8");
    } catch (error: any) {
      // 将原有的模糊错误转换为更友好的提示
      logger.error(`ZIP解压失败: ${error.message}`);
      throw new Error('ZIP文件解压失败。可能的原因：\n1. 文件损坏或密码保护\n2. 如果这是分卷压缩包(zip+z01+z02等)，需要启用7zip支持\n3. 文件格式不正确\n请检查文件或联系管理员启用7zip功能以获得更好的压缩包支持。');
    }
  } else {
    // 7zip状态为true，使用7zip解压（支持所有格式）
    return await use7zip(zipPath, dest);
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
