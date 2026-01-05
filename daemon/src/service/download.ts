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
      const urlObj = new URL(url);
      const response = await axios<Readable>({
        url,
        responseType: "stream",
        timeout: 1000 * 20,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
          "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
          Referer: urlObj.origin,
          "Upgrade-Insecure-Requests": "1",
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "none",
          "Sec-Fetch-User": "?1"
        },
        maxRedirects: 10
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
