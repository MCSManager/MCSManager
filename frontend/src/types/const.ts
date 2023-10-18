import { t } from "@/lang/i18n";
export const CARD_FIXED_HEIGHT = 200;

export const TERMINAL_CODE = [
  "UTF-8",
  "GBK",
  "GB2312",
  "GB18030",
  "BIG5",
  "Big5-HKSCS",
  "Shift_JIS",
  "KS_C_5601",
  "UTF-16"
];

export const INSTANCE_STATUS = {
  "-1": t("状态未知"),
  "0": t("已停止"),
  "1": t("正在停止"),
  "2": t("正在启动"),
  "3": t("正在运行")
};
