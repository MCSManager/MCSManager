import { $t } from "../i18n";
import path from "path";
import child_process from "child_process";
import os from "os";
import { t } from "i18next";
import logger from "../service/log";
import { ProcessWrapper } from "common";
import { PTY_PATH } from "../const";
import * as fs from "fs-extra";

const system = os.platform();

const LINUX_ZIP = "zip";
const LINUX_UNZIP = "unzip";
const WIN_7ZIP = "7z.exe";
const ZIP_TIMEOUT_SECONDS = 60 * 40;

const COMPRESS_ERROR_MSG = {
  invalidName: t("压缩或解压的文件名中包含非法字符，请重命名更改文件！"),
  exitErr: t("解压/压缩程序执行结果不正确，请检查文件权限并重试！"),
  startErr: t(
    "解压/压缩程序启动失败，请确保系统已安装 zip 和 unzip 命令并作用到 MCSManager 的节点！"
  ),
  timeoutErr: t("解压/压缩任务超时，已自动结束！")
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
  if (system === "win32") return await use7zipCompress(sourceZip, files);
  if (hasGolangProcess()) return await golangProcessZip(files, sourceZip, fileCode);
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
  if (hasGolangProcess()) return await golangProcessUnzip(zipPath, dest, fileCode);
  return await useUnzip(zipPath, dest);
}

function hasGolangProcess() {
  return fs.existsSync(PTY_PATH);
}

// ./pty_linux_arm64 -m unzip /Users/wangkun/Documents/OtherWork/MCSM-Daemon/data/InstanceData/3832159255b042da8cb3fd2012b0a996/tmp.zip /Users/wangkun/Documents/OtherWork/MCSM-Daemon/data/InstanceData/3832159255b042da8cb3fd2012b0a996
async function golangProcessUnzip(zipPath: string, destDir: string, fileCode: string = "utf-8") {
  logger.info("GO Zip Params", zipPath, destDir, fileCode);
  return await new ProcessWrapper(
    PTY_PATH,
    ["-coder", fileCode, "-m", "unzip", zipPath, destDir],
    process.cwd(),
    ZIP_TIMEOUT_SECONDS
  ).start();
}

async function golangProcessZip(files: string[], destZip: string, fileCode: string = "utf-8") {
  let p = ["-coder", fileCode, "-m", "zip"];
  p = p.concat(files);
  p.push(destZip);
  logger.info("GO Unzip Params", p);
  return await new ProcessWrapper(PTY_PATH, p, process.cwd(), ZIP_TIMEOUT_SECONDS).start();
}

async function useUnzip(sourceZip: string, destDir: string, code = "utf-8"): Promise<boolean> {
  const params = ["-o", path.basename(sourceZip), "-d", path.basename(destDir)];
  logger.info(`Function useUnzip(): Command: zip ${params.join(" ")}`);
  const subProcess = new ProcessWrapper(
    LINUX_UNZIP,
    params,
    path.dirname(sourceZip),
    ZIP_TIMEOUT_SECONDS,
    code
  );
  subProcess.setErrMsg(COMPRESS_ERROR_MSG);
  return subProcess.start();
}

// zip -r a.zip css css_v1 js
// The ZIP file compressed by this function and the directory where the file is located must be in the same directory
async function useZip(distZip: string, files: string[], code = "utf-8"): Promise<boolean> {
  if (!files || files.length == 0) throw new Error(t("请至少选择一个文件！"));
  files = files.map((v) => path.basename(v));
  const params = ["-r", path.basename(distZip), ...files];
  logger.info(`Function useZip(): Command: zip ${params.join(" ")}`);
  const subProcess = new ProcessWrapper(
    LINUX_ZIP,
    params,
    path.dirname(distZip),
    ZIP_TIMEOUT_SECONDS,
    code
  );
  subProcess.setErrMsg(COMPRESS_ERROR_MSG);
  return subProcess.start();
}

async function use7zipCompress(zipPath: string, files: string[], code = "utf-8"): Promise<boolean> {
  const params = ["a", "-aoa", zipPath, ...files];
  const cwd = path.normalize(path.join(process.cwd(), "lib"));
  console.log($t("TXT_CODE_common._7zip"), `${WIN_7ZIP} ${params.join(" ")}`);
  const subProcess = new ProcessWrapper(WIN_7ZIP, params, cwd, ZIP_TIMEOUT_SECONDS, code);
  subProcess.setErrMsg(COMPRESS_ERROR_MSG);
  return subProcess.start();
}

// ./7z.exe x archive.zip -oD:\7-Zip
async function use7zipDecompress(
  sourceZip: string,
  destDir: string,
  code = "utf-8"
): Promise<boolean> {
  const params = [`x`, "-aoa", sourceZip, `-o${destDir}`];
  console.log($t("TXT_CODE_common._7unzip"), `${params.join(" ")}`);
  const cwd = path.normalize(path.join(process.cwd(), "lib"));
  const subProcess = new ProcessWrapper(WIN_7ZIP, params, cwd, ZIP_TIMEOUT_SECONDS, code);
  subProcess.setErrMsg(COMPRESS_ERROR_MSG);
  return subProcess.start();
}
