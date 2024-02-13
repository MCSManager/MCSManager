import { $t } from "../i18n";
import path from "path";
import os from "os";
import { t } from "i18next";
import logger from "../service/log";
import { ProcessWrapper } from "common";
import * as fs from "fs-extra";
import compressing from "compressing";
import { pipeline } from "stream";

const SYSTEM_TYPE = os.platform();

const supportCode: Record<string, string> = {
  gbk: "gbk",
  "utf-8": "utf-8",
  utf8: "utf-8",
  big5: "big5",
  sjis: "sjis"
};

const LINUX_ZIP = "zip";
const LINUX_UNZIP = "unzip";
const WIN_7ZIP = "7z.exe";
const ZIP_TIMEOUT_SECONDS = 60 * 40;

const COMPRESS_ERROR_MSG = {
  invalidName: t("TXT_CODE_3aa9f36"),
  exitErr: t("TXT_CODE_2be83d36"),
  startErr: t(
    "TXT_CODE_37d839a4"
  ),
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
  // if (has7zip()) return await use7zipCompress(sourceZip, files);
  await useCompressing(files, sourceZip);
  return true;
}

export async function decompress(
  zipPath: string,
  dest: string,
  fileCode?: string
): Promise<boolean> {
  if (!checkFileName(zipPath) || !checkFileName(dest))
    throw new Error(COMPRESS_ERROR_MSG.invalidName);
  // if (has7zip()) return await use7zipDecompress(zipPath, dest);
  await useUnCompressing(zipPath, dest, fileCode);
  return true;
}

export async function useCompressing(files: string[], sourceZip: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tarStream = new compressing.zip.Stream();
    for (const filePath of files) tarStream.addEntry(filePath);
    if (fs.existsSync(sourceZip)) fs.removeSync(sourceZip);
    const destStream = fs.createWriteStream(sourceZip);
    tarStream.on("error", (err) => reject(err));
    destStream.on("error", (err) => reject(err));
    pipeline(tarStream, destStream, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    }).on("error", (err) => reject(err));
  });
}

export async function useUnCompressing(sourceZip: string, target: string, fileCode: string) {
  return await compressing.zip.uncompress(sourceZip, target, {
    zipFileNameEncoding: supportCode[fileCode.toLowerCase()] ?? "utf-8"
  });
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

function has7zip() {
  return (
    fs.existsSync(path.normalize(path.join(process.cwd(), "lib", WIN_7ZIP))) &&
    SYSTEM_TYPE === "win32"
  );
}

// zip -r a.zip css css_v1 js
// The ZIP file compressed by this function and the directory where the file is located must be in the same directory
async function useZip(distZip: string, files: string[], code = "utf-8"): Promise<boolean> {
  if (!files || files.length == 0) throw new Error(t("TXT_CODE_2038ec2c"));
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

// function hasGolangProcess() {
//   return fs.existsSync(PTY_PATH);
// }

// // ./pty_linux_arm64 -m unzip /Users/wangkun/Documents/OtherWork/MCSM-Daemon/data/InstanceData/3832159255b042da8cb3fd2012b0a996/tmp.zip /Users/wangkun/Documents/OtherWork/MCSM-Daemon/data/InstanceData/3832159255b042da8cb3fd2012b0a996
// async function golangProcessUnzip(zipPath: string, destDir: string, fileCode: string = "utf-8") {
//   logger.info("GO Zip Params", zipPath, destDir, fileCode);
//   return await new ProcessWrapper(
//     PTY_PATH,
//     ["-coder", fileCode, "-m", "unzip", zipPath, destDir],
//     process.cwd(),
//     ZIP_TIMEOUT_SECONDS
//   ).start();
// }

// async function golangProcessZip(files: string[], destZip: string, fileCode: string = "utf-8") {
//   let p = ["-coder", fileCode, "-m", "zip"];
//   p = p.concat(files);
//   p.push(destZip);
//   logger.info("GO Unzip Params", p);
//   return await new ProcessWrapper(PTY_PATH, p, process.cwd(), ZIP_TIMEOUT_SECONDS).start();
// }
