// @ts-check
import fs from "fs";
import path from "path";
import { Worker, isMainThread, workerData } from "node:worker_threads";
import { fileURLToPath } from "url";
import { parentPort, threadId } from "worker_threads";

// node scripts/useless-key-scanner.mjs languages zh_CN.json . ".js,.ts,.vue" "node_modules/"
const LANGUAGE_DIR = process.argv[2];
const LANGUAGE_SOURCE_FILE_NAME = process.argv[3];
const CODE_DIR = process.argv[4];
const INCLUDE_EXT_NAMES = String(process.argv[5]).split(",").filter(Boolean) || [];
const EXCLUDE_FILES = String(process.argv[6]).split(",").filter(Boolean) || [];

const CONCURRENT_COUNT = 50;

class Database {
  /** @type {Map<string, boolean>} */
  keysMap = new Map();

  /** @type {Object<string, string>} */
  sourceLangMap = {};

  languageDir = "";

  constructor(languageDir = "", languageSourceFileName = "") {
    this.languageDir = languageDir;
    this.sourceLangMap = JSON.parse(
      fs.readFileSync(path.join(languageDir, languageSourceFileName), "utf-8")
    );
    for (const key in this.sourceLangMap) {
      this.keysMap.set(key, false);
    }
  }

  async rewriteSourceLangFile() {
    for (const [key, value] of this.keysMap) {
      if (!value) {
        delete this.sourceLangMap[key];
      }
    }
    console.log("Rewrite file:", path.join(LANGUAGE_DIR, LANGUAGE_SOURCE_FILE_NAME));
    fs.writeFileSync(
      path.join(LANGUAGE_DIR, LANGUAGE_SOURCE_FILE_NAME),
      JSON.stringify(this.sourceLangMap, null, 2)
    );
    for (const filename of await fs.promises.readdir(this.languageDir)) {
      if (filename.endsWith(".json")) {
        const otherLangMap = JSON.parse(
          fs.readFileSync(path.join(this.languageDir, filename), "utf-8")
        );
        for (const key in otherLangMap) {
          if (!this.sourceLangMap[key]) {
            delete otherLangMap[key];
          }
        }
        console.log("Rewrite other lang file:", path.join(this.languageDir, filename));
        fs.writeFileSync(
          path.join(this.languageDir, filename),
          JSON.stringify(otherLangMap, null, 2)
        );
      }
    }
  }
}

/**
 * @param {string} codeDir
 * @param {Array<string>} scannedFiles
 * @param {Array<string>} excludeFiles
 * @returns {Promise<Array<string>>}
 */
async function scanCodeFiles(codeDir = "", scannedFiles = [], excludeFiles = []) {
  const codeFiles = fs.readdirSync(codeDir);
  for (const codeFile of codeFiles) {
    const codeFilePath = path.join(codeDir, codeFile);
    if (excludeFiles.some((excludeFile) => codeFilePath.includes(excludeFile))) continue;
    try {
      if (fs.statSync(codeFilePath).isDirectory()) {
        await scanCodeFiles(codeFilePath, scannedFiles, excludeFiles);
      } else {
        if (INCLUDE_EXT_NAMES.includes(path.extname(codeFilePath))) {
          scannedFiles.push(codeFilePath);
        }
      }
    } catch (error) {
      // ignore
    }
  }
  return scannedFiles;
}

/**
 * @param {Map<string, boolean>} langKeys
 * @param {Array<string>} filesPath
 * @param {Database} database
 */
function startThread(langKeys, filesPath, database) {
  const worker = new Worker(fileURLToPath(import.meta.url), {
    workerData: { langKeys, filesPath }
  });
  return new Promise((resolve, reject) => {
    worker.on("message", (msg) => {
      const { type, data } = msg;
      if (type === "key") {
        database.keysMap.set(data, true);
      }
      if (type === "exit") {
        console.log(`Thread ID: ${data} \tScan finished!`);
        resolve(null);
      }
    });
  });
}

async function mainThread() {
  console.log("process.argv:", process.argv);
  const database = new Database(LANGUAGE_DIR, LANGUAGE_SOURCE_FILE_NAME);
  const scannedFiles = await scanCodeFiles(CODE_DIR, [], EXCLUDE_FILES);
  console.log(`Scanned files (${INCLUDE_EXT_NAMES}):`, scannedFiles.length);
  const promises = [];
  for (let i = 0; i < scannedFiles.length; i += CONCURRENT_COUNT) {
    const filesPath = scannedFiles.slice(i, i + CONCURRENT_COUNT);
    promises.push(startThread(database.keysMap, filesPath, database));
  }
  await Promise.all(promises);
  console.log("Rewrite source lang file...");
  await database.rewriteSourceLangFile();
  console.log("Rewrite source lang file finished!");
  process.exit(0);
}

async function worker() {
  /** @type {Array<string>} */
  const filesPath = workerData.filesPath;
  /** @type {Map<string, boolean>} */
  const langKeys = workerData.langKeys;

  console.log("Create new thread ID:", threadId, "\tFiles:", filesPath.length);

  async function readOneFile(filePath = "") {
    const fileContent = await fs.promises.readFile(filePath, "utf-8");
    for (const key of langKeys.keys()) {
      if (fileContent.includes(key)) {
        parentPort?.postMessage({
          type: "key",
          data: key
        });
      }
    }
  }

  const promises = [];
  for (const filePath of filesPath) {
    promises.push(readOneFile(filePath));
  }
  await Promise.all(promises);
  parentPort?.postMessage({
    type: "exit",
    data: threadId
  });
}

if (isMainThread) {
  mainThread();
} else {
  worker();
}
