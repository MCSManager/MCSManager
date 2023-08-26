export function computeNodeName(ip: string, remark?: string) {
  return remark ? `${remark} - ${ip}` : ip;
}
