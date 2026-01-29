import { setAllLayoutConfig } from "@/config/originLayoutConfig";
import { getLayoutConfig } from "./apis/layout";
import { t } from "@/lang/i18n";

export async function initLayoutConfig() {
  const { value } = await getLayoutConfig().execute();
  try {
    const cfg = JSON.parse(value!);
    if (cfg instanceof Array) {
      setAllLayoutConfig(cfg);
      const settingsConfig = cfg.find((v: any) => v.page === "__settings__");
      document.title = settingsConfig?.theme?.pageTitle || t("TXT_CODE_47ae8ee6");
    }
  } catch (error: any) {
    console.error("init layout config error:", error);
  }
}
