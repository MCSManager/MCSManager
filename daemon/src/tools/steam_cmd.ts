import axios from "axios";
import fs from "fs-extra";
import path from "path";
import { pipeline, Readable } from "stream";
import { STEAM_CMD_PATH, SYSTEM_TYPE, WINDOWS_STEAM_CMD_URL } from "../const";
import logger from "../service/log";
import FileManager from "../service/system_file";

export async function initSteamCmd() {
  try {
    if (!fs.existsSync(STEAM_CMD_PATH) && SYSTEM_TYPE === "win32") {
      const zipPath = await downloadSteam(WINDOWS_STEAM_CMD_URL);
      await new FileManager().unzip(zipPath, "lib", "utf-8");
      await fs.remove(zipPath);
    }
  } catch (error) {
    logger.error(`Steam command line tool download failed: ${error}`);
  }
}

export async function downloadSteam(url: string): Promise<string> {
  const tmpPath = path.normalize(path.join(process.cwd(), "lib", "tmp_steamcmd.zip"));
  logger.info(`Starting Steam command line tool download: ${url} --> ${tmpPath}`);

  return new Promise(async (resolve, reject) => {
    try {
      // Ensure target directory exists
      const targetDir = path.dirname(tmpPath);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirsSync(targetDir);
      }

      // Remove existing file if it exists
      if (fs.existsSync(tmpPath)) {
        fs.removeSync(tmpPath);
      }

      // Download file
      const response = await axios<Readable>({
        url: url,
        responseType: "stream",
        timeout: 1000 * 60 * 10, // 10 minutes timeout
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36 MCSManager/10.0.0"
        }
      });

      // Create write stream
      const writeStream = fs.createWriteStream(path.normalize(tmpPath));

      // Use pipeline to handle streams
      pipeline(response.data, writeStream, async (err) => {
        if (err) {
          fs.remove(tmpPath, () => {});
          reject(err);
        } else {
          fs.chmod(tmpPath, 0o755, () => {});
          resolve(tmpPath);
        }
      });
    } catch (error: any) {
      reject(error.message || error);
    }
  });
}
