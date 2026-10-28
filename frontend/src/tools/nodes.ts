import { t } from "@/lang/i18n";
import type { NodeStatus } from "@/types/index";

export const SELECTED_REMOTE_STORAGE_KEY = "pageSelectedRemote";

export function computeNodeName(ip: string, available: boolean, remark?: string) {
  if (!ip) return t("TXT_CODE_aa373641");
  const online = available ? "" : t("TXT_CODE_836addb9");
  return remark ? `${remark} - ${ip} ${online}` : `${ip} ${online}`;
}

export function resolveStoredRemoteNode(
  raw: string | null,
  nodes: NodeStatus[],
  globalNode?: NodeStatus
): NodeStatus | undefined {
  if (nodes.length === 0) return undefined;

  let storedUuid: unknown;
  if (raw) {
    try {
      storedUuid = (JSON.parse(raw) as { uuid?: unknown } | null)?.uuid;
    } catch {
      storedUuid = undefined;
    }
  }

  if (typeof storedUuid === "string") {
    if (globalNode && storedUuid === globalNode.uuid) return globalNode;
    const matched = nodes.find((node) => node.uuid === storedUuid);
    if (matched) return matched;
  }

  return nodes[0];
}
