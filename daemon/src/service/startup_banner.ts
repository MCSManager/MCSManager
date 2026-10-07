import { $t } from "../i18n";
import logger from "./log";

// Print the daemon startup banner.
//
// The access key is a secret: it is printed with console.log (stdout only)
// so it reaches the operator's terminal but is NEVER persisted into the
// application log file (logs/current.log and its rotations), unlike every
// other banner line which goes through the logger.
export function printStartupBanner(config: { port: number; ssl: boolean; key: string }) {
  logger.info("----------------------------");
  logger.info($t("TXT_CODE_app.started"));
  logger.info($t("TXT_CODE_app.doc"));
  let appHost = $t("TXT_CODE_app.host", { port: config.port });
  if (config.ssl) appHost = appHost.replace("http", "https");
  logger.info(appHost);
  logger.info($t("TXT_CODE_app.configPathTip", { path: "" }));
  console.log($t("TXT_CODE_app.password", { key: config.key }));
  logger.info($t("TXT_CODE_app.passwordTip"));
  logger.info($t("TXT_CODE_app.exitTip"));
  logger.info("----------------------------");
  console.log("");
}
