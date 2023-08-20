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

export { FILENAME_BLACKLIST, PTY_PATH, LOCAL_PRESET_LANG_PATH, FRPC_PATH, IGNORE };
