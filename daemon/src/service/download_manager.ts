import axios from "axios";
import { createWriteStream } from "fs";
import { Throttle } from "stream-throttle";
import { globalConfiguration } from "../entity/config";

class DownloadManager {
  public downloadingCount = 0;

  public async downloadFromUrl(url: string, targetPath: string): Promise<void> {
    const response = await axios({
      method: "get",
      url: url,
      responseType: "stream"
    });

    this.downloadingCount++;
    return new Promise((resolve, reject) => {
      const stream = response.data;

      const writeStream = createWriteStream(targetPath);
      const onError = (err: Error) => {
        stream.destroy();
        writeStream.destroy();

        reject(err);
        this.downloadingCount--;
      };
      const onFinish = () => {
        resolve();
        this.downloadingCount--;
      };

      stream.on("error", onError);
      writeStream.on("error", onError);
      writeStream.on("finish", onFinish);

      const speedLimit = globalConfiguration.config.uploadSpeedRate;
      if (speedLimit > 0) {
        const throttleStream = new Throttle({
          rate: speedLimit * 64 * 1024
        });
        throttleStream.on("error", onError);
        stream.pipe(throttleStream).pipe(writeStream);
      } else {
        stream.pipe(writeStream);
      }
    });
  }
}

const downloadManager = new DownloadManager();

export default downloadManager;
