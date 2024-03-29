import path from "path";
import { t } from "i18next";
import logger from "../service/log";
import { ProcessWrapper } from "common";
import fs from "fs-extra";
import { GOLANG_ZIP_PATH } from "../const";
import { ZIP_TIMEOUT_SECONDS } from "../const";

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
  return await useUnzip(zipPath, dest, fileCode || "utf-8");
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
