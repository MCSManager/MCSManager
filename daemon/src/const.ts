import os from "os";
import path from "path";

function loadSteamCmdPath() {
  let targetPath = path.normalize(
    path.join(
      process.cwd(),
      "lib",
      os.platform() === "win32" ? "steamcmd.exe" : `steamcmd_${os.arch()}`
    )
  );
  return targetPath;
}

function generate7zipConstants() {
  const platform = os.platform();
  const arch = os.arch();
  
  let folder: string;
  let name: string;
  
  if (platform === "win32") {
    folder = "7z2501-extra";
    name = "7za.exe";
  } else if (platform === "linux") {
    if (arch === "x64") {
      folder = "7z2501-linux-x86";
    } else if (arch === "arm64") {
      folder = "7z2501-linux-arm";
    } else {
      // 其他架构默认使用x86
      folder = "7z2501-linux-x86";
    }
    name = "7zz";
  } else if (platform === "darwin") {
    folder = "7z2501-mac";
    name = "7zz";
  } else {
    // 其他系统默认使用linux配置
    folder = "7z2501-linux-x86";
    name = "7zz";
  }
  
  return { folder, name };
}

const SYS_INFO = `${os.platform()}_${os.arch()}${os.platform() === "win32" ? ".exe" : ""}`;
const ptyName = `pty_${SYS_INFO}`;
const frpcName = `frpc_${SYS_INFO}`;
const PTY_PATH = path.normalize(path.join(process.cwd(), "lib", ptyName));
const FRPC_PATH = path.normalize(path.join(process.cwd(), "lib", frpcName));
const FILENAME_BLACKLIST = ["\\", "/", ".", "'", '"', "?", "*", "<", ">"];
const LOCAL_PRESET_LANG_PATH = path.normalize(path.join(process.cwd(), "language"));
const IGNORE = "[IGNORE_LOG]";
const SYSTEM_TYPE = os.platform();
const ZIP_TIMEOUT_SECONDS = 60 * 40;
const GOLANG_ZIP_NAME = `file_zip_${SYSTEM_TYPE}_${os.arch()}${
  SYSTEM_TYPE === "win32" ? ".exe" : ""
}`;
const GOLANG_ZIP_PATH = path.normalize(path.join(process.cwd(), "lib", GOLANG_ZIP_NAME));
const STEAM_CMD_PATH = loadSteamCmdPath();
const WINDOWS_STEAM_CMD_URL = "https://steamcdn-a.akamaihd.net/client/installer/steamcmd.zip";

// 生成7zip相关常量
const { folder: SEVEN_ZIP_FOLDER, name: SEVEN_ZIP_NAME } = generate7zipConstants();
const SEVEN_ZIP_PATH = path.normalize(path.join(process.cwd(), "lib", SEVEN_ZIP_FOLDER, SEVEN_ZIP_NAME));

// 7zip状态全局变量
let SEVEN_ZIP_STATUS = false;

export {
  FILENAME_BLACKLIST,
  FRPC_PATH,
  GOLANG_ZIP_PATH,
  IGNORE,
  LOCAL_PRESET_LANG_PATH,
  PTY_PATH,
  SEVEN_ZIP_FOLDER,
  SEVEN_ZIP_NAME,
  SEVEN_ZIP_PATH,
  SEVEN_ZIP_STATUS,
  STEAM_CMD_PATH,
  SYSTEM_TYPE,
  WINDOWS_STEAM_CMD_URL,
  ZIP_TIMEOUT_SECONDS
};

// 设置7zip状态的函数
export function setSevenZipStatus(status: boolean) {
  SEVEN_ZIP_STATUS = status;
}

