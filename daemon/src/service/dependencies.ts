import fs from "fs-extra";
import { GOLANG_ZIP_PATH } from "../const";
import { initSteamCmd } from "../tools/steam_cmd";

export function checkDependencies() {
  initSteamCmd();

  const dependencies = [GOLANG_ZIP_PATH];
  dependencies.forEach((path) => {
    if (!fs.existsSync(path)) {
      throw new Error(`MCSManager requires additional dependencies to run. Please download the files suitable for your system architecture from the following locations:\n1. https://github.com/MCSManager/PTY/releases\n2. https://github.com/MCSManager/Zip-Tools/releases`);
    }
  });
}
