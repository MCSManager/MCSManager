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
const STEAM_CMD_URL = "https://steamcdn-a.akamaihd.net/client/installer/steamcmd.zip";

export {
  FILENAME_BLACKLIST,
  FRPC_PATH,
  GOLANG_ZIP_PATH,
  IGNORE,
  LOCAL_PRESET_LANG_PATH,
  PTY_PATH,
  STEAM_CMD_PATH,
  STEAM_CMD_URL,
  ZIP_TIMEOUT_SECONDS
};
