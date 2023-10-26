import { setAllLayoutConfig } from "@/config/originLayoutConfig";
import { getLayoutConfig } from "./apis/layout";

export async function initLayoutConfig() {
  const { value } = await getLayoutConfig().execute();
  try {
    const cfg = JSON.parse(value!);
    if (cfg instanceof Array) {
      setAllLayoutConfig(cfg);
    }
  } catch (error) {
    console.error("init layout config error:", error);
  }
}
