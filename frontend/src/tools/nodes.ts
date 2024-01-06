import { t } from "@/lang/i18n";

export function computeNodeName(ip: string, available: boolean, remark?: string) {
  if (!ip) return t("请选择节点");
  const online = available ? "" : t("TXT_CODE_836addb9");
  return remark ? `${remark} - ${ip} ${online}` : `${ip} ${online}`;
}
