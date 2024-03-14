import path from "path";
import fs from "fs-extra";
import axios from "axios";
import { pipeline, Readable } from "stream";
import logger from "./log";

export function downloadFileToLocalFile(url: string, localFilePath: string): Promise<boolean> {
  logger.info(`Download File: ${url} --> ${path.normalize(localFilePath)}`);
  return new Promise(async (resolve, reject) => {
    try {
      if (fs.existsSync(localFilePath)) fs.removeSync(localFilePath);
      const response = await axios<Readable>({
        url,
        responseType: "stream",
        timeout: 1000 * 10
      });
      const writeStream = fs.createWriteStream(path.normalize(localFilePath));
      pipeline(response.data, writeStream, (err) => {
        if (err) {
          fs.remove(localFilePath, () => {});
          reject(err);
        } else {
          fs.chmodSync(localFilePath, 0o777);
          resolve(true);
        }
      });
    } catch (error: any) {
      reject(error.message);
    }
  });
}
