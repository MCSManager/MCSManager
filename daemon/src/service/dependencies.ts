import { GOLANG_ZIP_PATH } from "../const";
import fs from "fs-extra";
import { t } from "i18next";

export function checkDependencies() {
  const dependencies = [GOLANG_ZIP_PATH];
  dependencies.forEach((path) => {
    if (!fs.existsSync(path)) {
      throw new Error(t("TXT_CODE_6915f2a") + path);
    }
  });
}
