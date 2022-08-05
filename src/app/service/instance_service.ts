// Copyright (C) 2022 MCSManager <mcsmanager-dev@outlook.com>

// Multi-forward operation method
export function multiOperationForwarding(
  instances: any[],
  callback: (remoteUuid: string, instanceUuids: string[]) => void
) {
  // classification table
  const map = new Map<string, string[]>();
  // Classify remote hosts and instance IDs based on information
  for (const instanceInfo of instances) {
    const remoteUuid: string = instanceInfo.serviceUuid;
    const instanceUuid: string = instanceInfo.instanceUuid;
    if (map.has(remoteUuid)) {
      map.get(remoteUuid).push(instanceUuid);
    } else {
      map.set(remoteUuid, [instanceUuid]);
    }
  }
  // Pack and forward the classified data separately
  for (const iterator of map) {
    const remoteUuid = iterator[0];
    const instanceUuids = iterator[1];
    callback(remoteUuid, instanceUuids);
  }
}
