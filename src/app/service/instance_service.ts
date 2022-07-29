// Copyright (C) 2022 MCSManager Team <mcsmanager-dev@outlook.com>

// 多转发操作方法
export function multiOperationForwarding(
  instances: any[],
  callback: (remoteUuid: string, instanceUuids: string[]) => void
) {
  // 分类表
  const map = new Map<string, string[]>();
  // 根据信息进行远程主机与实例ID分类
  for (const instanceInfo of instances) {
    const remoteUuid: string = instanceInfo.serviceUuid;
    const instanceUuid: string = instanceInfo.instanceUuid;
    if (map.has(remoteUuid)) {
      map.get(remoteUuid).push(instanceUuid);
    } else {
      map.set(remoteUuid, [instanceUuid]);
    }
  }
  // 将分类好的数据分别打包转发
  for (const iterator of map) {
    const remoteUuid = iterator[0];
    const instanceUuids = iterator[1];
    callback(remoteUuid, instanceUuids);
  }
}
