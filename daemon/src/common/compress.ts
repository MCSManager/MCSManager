import { $t } from "../i18n";
import path from "path";
import child_process from "child_process";
import os from "os";
import { t } from "i18next";
import logger from "../service/log";

const system = os.platform();

const COMPRESS_ERROR_MSG = {
  invalidName: t("压缩或解压的文件名中包含非法字符，请重命名更改文件！"),
  exitErr: t("解压/压缩程序执行结果不正确，请检查文件权限并重试！"),
  startErr: t(
    "解压/压缩程序启动失败，请确保系统已安装 zip 和 unzip 命令并作用到 MCSManager 的节点！"
  ),
  timeoutErr: t("解压/压缩任务超时，已自动结束！")
};

function checkFileName(fileName: string) {
  const disableList = ['"', "?", "|", "&"];
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
  if (system === "win32") return await use7zipCompress(sourceZip, files);
  return await useZip(sourceZip, files);
}

export async function decompress(
  zipPath: string,
  dest: string,
  fileCode?: string
): Promise<boolean> {
  if (!checkFileName(zipPath) || !checkFileName(dest))
    throw new Error(COMPRESS_ERROR_MSG.invalidName);
  if (system === "win32") return await use7zipDecompress(zipPath, dest);
  return await useUnzip(zipPath, dest);
}

function setTimeoutTask(
  subProcess: child_process.ChildProcessWithoutNullStreams,
  target: string | string[],
  reject: (b: any) => void,
  id: number | string
) {
  setTimeout(() => {
    if (!subProcess.exitCode && subProcess.exitCode !== 0) {
      subProcess.kill("SIGKILL");
      logger.error(
        `[ZIP] ID: ${id} ${JSON.stringify(target)} Task timeout, exitCode: ${subProcess.exitCode}`
      );
      reject(new Error(COMPRESS_ERROR_MSG.timeoutErr));
    } else {
      reject(new Error(COMPRESS_ERROR_MSG.exitErr));
    }
  }, 1000 * 60);
}

async function useUnzip(sourceZip: string, destDir: string): Promise<boolean> {
  const id = Date.now();
  return new Promise((resolve, reject) => {
    logger.info(
      `ID: ${id} Function useUnzip(): Command: unzip ${["-o", sourceZip, "-d", destDir].join(" ")}}`
    );
    const subProcess = child_process.spawn("unzip", ["-o", sourceZip, "-d", destDir], {
      cwd: path.normalize(path.dirname(sourceZip)),
      stdio: "pipe",
      windowsHide: true
    });
    if (!subProcess || !subProcess.pid) return reject(new Error(COMPRESS_ERROR_MSG.startErr));
    subProcess.stdout.on("data", (text) => {});
    subProcess.stderr.on("data", (text) => {});
    subProcess.on("exit", (code) => {
      logger.info(`ID: ${id} Function useUnzip() Done, return code: ${code}`);
      if (code) return reject(new Error(COMPRESS_ERROR_MSG.exitErr));
      return resolve(true);
    });
    setTimeoutTask(subProcess, sourceZip, reject, id);
  });
}

// zip -r a.zip css css_v1 js
// The ZIP file compressed by this function and the directory where the file is located must be in the same directory
async function useZip(distZip: string, files: string[]): Promise<boolean> {
  const id = Date.now();
  if (!files || files.length == 0) return false;
  files = files.map((v) => path.basename(v));
  return new Promise((resolve, reject) => {
    logger.info(`ID: ${id} Function useZip(): Command: zip ${["-r", distZip, ...files].join(" ")}`);
    const subProcess = child_process.spawn("zip", ["-r", distZip, ...files], {
      cwd: path.normalize(path.dirname(distZip)),
      stdio: "pipe",
      windowsHide: true
    });
    if (!subProcess || !subProcess.pid) return reject(new Error(COMPRESS_ERROR_MSG.startErr));
    subProcess.stdout.on("data", (text) => {});
    subProcess.stderr.on("data", (text) => {});
    subProcess.on("exit", (code) => {
      logger.info(`ID: ${id} Function useZip() Done, return code: ${code}`);
      if (code) return reject(new Error(COMPRESS_ERROR_MSG.exitErr));
      return resolve(true);
    });
    setTimeoutTask(subProcess, files, reject, id);
  });
}

async function use7zipCompress(zipPath: string, files: string[]): Promise<boolean> {
  const cmd = `7z.exe a ${zipPath} ${files.join(" ")}`.split(" ");
  console.log($t("TXT_CODE_common._7zip"), `${cmd.join(" ")}`);
  return new Promise((resolve, reject) => {
    const p = cmd.splice(1);
    const subProcess = child_process.spawn(cmd[0], [...p], {
      cwd: path.normalize(path.join(process.cwd(), "7zip")),
      stdio: "pipe"
    });
    if (!subProcess || !subProcess.pid) return reject(new Error(COMPRESS_ERROR_MSG.startErr));
    subProcess.on("exit", (code) => {
      if (code) return reject(new Error(COMPRESS_ERROR_MSG.exitErr));
      return resolve(true);
    });
    setTimeoutTask(subProcess, files, reject, "");
  });
}

// ./7z.exe x archive.zip -oD:\7-Zip
async function use7zipDecompress(sourceZip: string, destDir: string): Promise<boolean> {
  const cmd = `7z.exe x ${sourceZip} -o${destDir}`.split(" ");
  console.log($t("TXT_CODE_common._7unzip"), `${cmd.join(" ")}`);
  return new Promise((resolve, reject) => {
    const subProcess = child_process.spawn(cmd[0], [cmd[1], cmd[2], cmd[3]], {
      cwd: path.normalize(path.join(process.cwd(), "7zip")),
      stdio: "pipe"
    });
    if (!subProcess || !subProcess.pid) return reject(new Error(COMPRESS_ERROR_MSG.startErr));
    subProcess.on("exit", (code) => {
      if (code) return reject(new Error(COMPRESS_ERROR_MSG.exitErr));
      return resolve(true);
    });
    setTimeoutTask(subProcess, sourceZip, reject, "");
  });
}
