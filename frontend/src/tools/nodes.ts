import { t } from "@/lang/i18n";

export function computeNodeName(ip: string, available: boolean, remark?: string) {
  const online = available ? "" : t("(离线)");
  return remark ? `${remark} - ${ip} ${online}` : `${ip} ${online}`;
}
