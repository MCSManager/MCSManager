import { $t } from "../i18n";
import fs from "fs-extra";
import path from "path";
import * as compressing from "compressing";
import child_process from "child_process";
import os from "os";
import archiver from "archiver";
import StreamZip, { async } from "node-stream-zip";
import { processWrapper } from "common";
import { PTY_PATH } from "../const";
// const StreamZip = require('node-stream-zip');

// Cross-platform high-efficiency/low-efficiency decompression scheme
const system = os.platform();

function checkFileName(fileName: string) {
  const disableList = ['"', "/", "\\", "?", "|"];
  for (const iterator of disableList) {
    if (fileName.includes(iterator)) return false;
  }
  return true;
}

function archiveZip(
  zipPath: string,
  files: string[],
  fileCode: string = "utf-8"
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver("zip", {
      zlib: { level: 9 }
      // encoding: fileCode
    });
    files.forEach((v) => {
      const basename = path.normalize(path.basename(v));
      if (!fs.existsSync(v)) return;
      if (fs.statSync(v)?.isDirectory()) {
        archive.directory(v, basename);
      } else {
        archive.file(v, { name: basename });
      }
    });
    output.on("close", function () {
      resolve(true);
    });
    archive.on("warning", function (err) {
      reject(err);
    });
    archive.on("error", function (err) {
      reject(err);
    });
    archive.pipe(output);
    archive.finalize();
  });
}

function archiveUnZip(
  sourceZip: string,
  destDir: string,
  fileCode: string = "utf-8"
): Promise<boolean> {
  return new Promise(async (resolve, reject) => {
    const zip = new StreamZip.async({ file: sourceZip, nameEncoding: fileCode });
    if (!fs.existsSync(destDir)) fs.mkdirsSync(destDir);
    try {
      await zip.extract(null, destDir);
      return resolve(true);
    } catch (error) {
      reject(error);
    }
    zip
      .close()
      .then(() => {})
      .catch(() => {});
  });
}

export async function compress(
  sourceZip: string,
  files: string[],
  fileCode?: string
): Promise<boolean> {
  // if (system === "linux" && haveLinuxZip()) return await linuxZip(sourceZip, files);
  // return await nodeCompress(sourceZip, files, fileCode);
  if (hasGolangProcess()) return golangProcessZip(files, sourceZip, fileCode);
  return await archiveZip(sourceZip, files, fileCode);
}

export async function decompress(
  zipPath: string,
  dest: string,
  fileCode?: string
): Promise<boolean> {
  // if (system === "linux" && haveLinuxUnzip()) return await linuxUnzip(zipPath, dest);
  // return await nodeDecompress(zipPath, dest, fileCode);
  if (hasGolangProcess()) return await golangProcessUnzip(zipPath, dest, fileCode);
  return await archiveUnZip(zipPath, dest, fileCode);
}

async function _7zipCompress(zipPath: string, files: string[]) {
  const cmd = `7z.exe a ${zipPath} ${files.join(" ")}`.split(" ");
  console.log($t("TXT_CODE_common._7zip"), `${cmd.join(" ")}`);
  return new Promise((resolve, reject) => {
    const p = cmd.splice(1);
    const process = child_process.spawn(cmd[0], [...p], {
      cwd: "./7zip/"
    });
    if (!process || !process.pid) return reject(false);
    process.on("exit", (code) => {
      if (code) return reject(false);
      return resolve(true);
    });
  });
}

async function _7zipDecompress(sourceZip: string, destDir: string) {
  // ./7z.exe x archive.zip -oD:\7-Zip
  const cmd = `7z.exe x ${sourceZip} -o${destDir}`.split(" ");
  console.log($t("TXT_CODE_common._7unzip"), `${cmd.join(" ")}`);
  return new Promise((resolve, reject) => {
    const process = child_process.spawn(cmd[0], [cmd[1], cmd[2], cmd[3]], {
      cwd: "./7zip/"
    });
    if (!process || !process.pid) return reject(false);
    process.on("exit", (code) => {
      if (code) return reject(false);
      return resolve(true);
    });
  });
}

function haveLinuxUnzip() {
  try {
    const result = child_process.execSync("unzip -hh");
    return result?.toString("utf-8").toLowerCase().includes("extended help for unzip");
  } catch (error) {
    return false;
  }
}

function haveLinuxZip() {
  try {
    const result = child_process.execSync("zip -h2");
    return result?.toString("utf-8").toLowerCase().includes("extended help for zip");
  } catch (error) {
    return false;
  }
}

async function linuxUnzip(sourceZip: string, destDir: string) {
  return new Promise((resolve, reject) => {
    let end = false;
    const process = child_process.spawn("unzip", ["-o", sourceZip, "-d", destDir], {
      cwd: path.normalize(path.dirname(sourceZip))
    });
    if (!process || !process.pid) return reject(false);
    process.on("exit", (code) => {
      end = true;
      if (code) return reject(false);
      return resolve(true);
    });
    // timeout, terminate the task
    setTimeout(() => {
      if (end) return;
      process.kill("SIGKILL");
      reject(false);
    }, 1000 * 60 * 60);
  });
}

// zip -r a.zip css css_v1 js
// The ZIP file compressed by this function and the directory where the file is located must be in the same directory
async function linuxZip(sourceZip: string, files: string[]) {
  if (!files || files.length == 0) return false;
  return new Promise((resolve, reject) => {
    let end = false;
    files = files.map((v) => path.normalize(path.basename(v)));
    const process = child_process.spawn("zip", ["-r", sourceZip, ...files], {
      cwd: path.normalize(path.dirname(sourceZip))
    });
    if (!process || !process.pid) return reject(false);
    process.on("exit", (code) => {
      end = true;
      if (code) return reject(false);
      return resolve(true);
    });
    // timeout, terminate the task
    setTimeout(() => {
      if (end) return;
      process.kill("SIGKILL");
      reject(false);
    }, 1000 * 60 * 60);
  });
}

async function nodeCompress(zipPath: string, files: string[], fileCode: string = "utf-8") {
  const stream = new compressing.zip.Stream();
  files.forEach((v) => {
    stream.addEntry(v, {});
  });
  const destStream = fs.createWriteStream(zipPath);
  stream.pipe(destStream);
}

async function nodeDecompress(sourceZip: string, destDir: string, fileCode: string = "utf-8") {
  return await compressing.zip.uncompress(sourceZip, destDir, {
    zipFileNameEncoding: fileCode
  });
}

function hasGolangProcess() {
  return fs.existsSync(PTY_PATH);
}

// ./pty_linux_arm64 -m unzip /Users/wangkun/Documents/OtherWork/MCSM-Daemon/data/InstanceData/3832159255b042da8cb3fd2012b0a996/tmp.zip /Users/wangkun/Documents/OtherWork/MCSM-Daemon/data/InstanceData/3832159255b042da8cb3fd2012b0a996
async function golangProcessUnzip(zipPath: string, destDir: string, fileCode: string = "utf-8") {
  console.log("GO Zip Params", zipPath, destDir, fileCode);
  return await new processWrapper(
    PTY_PATH,
    ["-coder", fileCode, "-m", "unzip", zipPath, destDir],
    ".",
    60 * 30
  ).start();
}

async function golangProcessZip(files: string[], destZip: string, fileCode: string = "utf-8") {
  let p = ["-coder", fileCode, "-m", "zip"];
  p = p.concat(files);
  p.push(destZip);
  console.log("GO Unzip Params", p);
  return await new processWrapper(PTY_PATH, p, ".", 60 * 30).start();
}

// async function test() {
//   console.log(
//     "UNZIP::",
//     await golangProcessUnzip(
//       "/Users/wangkun/Documents/OtherWork/MCSM-Daemon/data/InstanceData/3832159d255b042da8cb3fd2012b0a996/tmp.zip",
//       "/Users/wangkun/Documents/OtherWork/MCSM-Daemon/data/InstanceData/3832159255b042da8cb3fd2012b0a996",
//       "utf-8"
//     )
//   );
// }

// test();
