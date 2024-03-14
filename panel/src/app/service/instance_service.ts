// Multi-forward operation method
export function multiOperationForwarding(
  instances: any[],
  callback: (daemonId: string, instanceUuids: string[]) => void
) {
  // classification table
  const map = new Map<string, string[]>();
  // Classify remote hosts and instance IDs based on information
  for (const instanceInfo of instances) {
    const daemonId: string = instanceInfo.daemonId;
    const instanceUuid: string = instanceInfo.instanceUuid;
    if (map.has(daemonId)) {
      map.get(daemonId)?.push(instanceUuid);
    } else {
      map.set(daemonId, [instanceUuid]);
    }
  }
  // Pack and forward the classified data separately
  for (const iterator of map) {
    const daemonId = iterator[0];
    const instanceUuids = iterator[1];
    callback(daemonId, instanceUuids);
  }
}
