import os from "os";
import path from "path";

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

export {
  GOLANG_ZIP_PATH,
  FILENAME_BLACKLIST,
  PTY_PATH,
  LOCAL_PRESET_LANG_PATH,
  FRPC_PATH,
  IGNORE,
  ZIP_TIMEOUT_SECONDS
};
