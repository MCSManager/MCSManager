import { $t } from "../i18n";
import os from "os";
import fs from "fs-extra";
import https from "https";
import path from "path";
import logger from "./log";
import { downloadFileToLocalFile } from "./download";

const PTY_NAME = `pty_${os.platform()}_${os.arch()}${os.platform() === "win32" ? ".exe" : ""}`;
const PTY_PATH = path.normalize(path.join(process.cwd(), "lib", PTY_NAME));
const PTY_DIR_PATH = path.join(process.cwd(), "lib");

function ptyChmod() {
  try {
    fs.chmodSync(PTY_PATH, 0o755);
    return true;
  } catch (error) {
    logger.warn($t("TXT_CODE_install.changeModeErr", { path: PTY_PATH }));
    fs.remove(PTY_PATH, () => {});
    return false;
  }
}

async function installPty(url: string): Promise<boolean> {
  if (!fs.existsSync(PTY_DIR_PATH)) fs.mkdirsSync(PTY_DIR_PATH);
  if (fs.existsSync(PTY_PATH) && fs.statSync(PTY_PATH)?.size > 1024) {
    if (!ptyChmod()) throw new Error("ptyChmod error");
    logger.info($t("TXT_CODE_install.ptySupport"));
    return true;
  }
  await downloadFileToLocalFile(url, PTY_PATH);
  return true;
}

// Emulate terminal-dependent programs, PTY programs based on Go/C++
// Reference: https://github.com/MCSManager/pty
export function initDependent() {
  const ptyUrls = [`https://mcsmanager.oss-cn-guangzhou.aliyuncs.com/${PTY_NAME}`];
  function setup(index = 0) {
    installPty(ptyUrls[index])
      .then(() => {
        logger.info($t("TXT_CODE_install.installed"));
        logger.info($t("TXT_CODE_install.guide"));
        ptyChmod();
      })
      .catch((err: Error) => {
        fs.remove(PTY_PATH, () => {});
        if (index === ptyUrls.length - 1) {
          logger.warn($t("TXT_CODE_install.installErr"));
          logger.warn(err.message);
          return;
        }
        return setup(index + 1);
      });
  }

  setup(0);
}
