import { GOLANG_ZIP_PATH } from "../const";
import fs from "fs-extra";
import { t } from "i18next";

export function checkDependencies() {
  const dependencies = [GOLANG_ZIP_PATH];
  dependencies.forEach((path) => {
    if (!fs.existsSync(path)) {
      throw new Error(t("缺少依赖文件，无法启动，请重新安装此程序：") + path);
    }
  });
}
