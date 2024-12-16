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
  sourceLangFile = {};

  constructor(languageDir = "", languageSourceFileName = "") {
    this.sourceLangFile = JSON.parse(
      fs.readFileSync(path.join(languageDir, languageSourceFileName), "utf-8")
    );
    for (const key in this.sourceLangFile) {
      this.keysMap.set(key, false);
    }
  }

  rewriteSourceLangFile() {
    for (const [key, value] of this.keysMap) {
      if (!value) {
        delete this.sourceLangFile[key];
      }
    }
    fs.writeFileSync(
      path.join(LANGUAGE_DIR, LANGUAGE_SOURCE_FILE_NAME),
      JSON.stringify(this.sourceLangFile, null, 2)
    );
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
        console.log(`Thread ${data} scan finished!`);
        resolve(null);
      }
    });
  });
}

async function mainThread() {
  console.log("process.argv:", process.argv);
  const database = new Database(LANGUAGE_DIR, LANGUAGE_SOURCE_FILE_NAME);
  const scannedFiles = await scanCodeFiles(CODE_DIR, [], EXCLUDE_FILES);

  const promises = [];
  for (let i = 0; i < scannedFiles.length; i += CONCURRENT_COUNT) {
    const filesPath = scannedFiles.slice(i, i + CONCURRENT_COUNT);
    promises.push(startThread(database.keysMap, filesPath, database));
  }
  await Promise.all(promises);
  console.log("Rewrite source lang file...");
  database.rewriteSourceLangFile();
  console.log("Rewrite source lang file finished!");
  const langDir = path.dirname(LANGUAGE_DIR);
}

async function worker() {
  /** @type {Array<string>} */
  const filesPath = workerData.filesPath;
  /** @type {Map<string, boolean>} */
  const langKeys = workerData.langKeys;

  console.log(
    "New Thread ID:",
    threadId,
    "Scan queue size:",
    filesPath.length,
    "Lang keys size:",
    langKeys.size
  );

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
