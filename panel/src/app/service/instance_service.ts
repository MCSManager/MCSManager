import userSystem from "../service/user_service";
import RemoteServiceSubsystem from "../service/remote_service";
import RemoteRequest from "../service/remote_command";

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

export async function getInstancesByUuid(uuid: string, advanced: boolean = false) {
  const user = userSystem.getInstance(uuid);
  if (!user) throw new Error("The UID does not exist");

  // Advanced functions are optional, analyze each instance data
  let resInstances = [];
  if (advanced) {
    const instances = user.instances;
    for (const iterator of instances) {
      const remoteService = RemoteServiceSubsystem.getInstance(iterator.daemonId);
      // If the remote service doesn't exist at all, load a deleted prompt
      if (!remoteService) {
        resInstances.push({
          hostIp: "-- Unknown --",
          instanceUuid: iterator.instanceUuid,
          daemonId: iterator.daemonId,
          status: -1,
          nickname: "--",
          remarks: "--"
        });
        continue;
      }
      try {
        // Note: UUID can be integrated here to save the returned traffic, and this optimization will not be done for the time being
        let instancesInfo = await new RemoteRequest(remoteService).request("instance/section", {
          instanceUuids: [iterator.instanceUuid]
        });
        instancesInfo = instancesInfo[0];
        resInstances.push({
          hostIp: `${remoteService.config.ip}:${remoteService.config.port}`,
          remarks: remoteService.config.remarks,
          instanceUuid: instancesInfo.instanceUuid,
          daemonId: remoteService.uuid,
          status: instancesInfo.status,
          nickname: instancesInfo.config.nickname,
          ie: instancesInfo.config.ie,
          oe: instancesInfo.config.oe,
          endTime: instancesInfo.config.endTime,
          lastDatetime: instancesInfo.config.lastDatetime,
          stopCommand: instancesInfo.config.stopCommand
        });
      } catch (error: any) {
        resInstances.push({
          hostIp: `${remoteService.config.ip}:${remoteService.config.port}`,
          instanceUuid: iterator.instanceUuid,
          daemonId: iterator.daemonId,
          status: -1,
          nickname: "--"
        });
      }
    }
  } else {
    resInstances = user.instances;
  }
  // respond to user data
  return {
    uuid: user.uuid,
    userName: user.userName,
    loginTime: user.loginTime,
    registerTime: user.registerTime,
    instances: resInstances,
    permission: user.permission,
    apiKey: user.apiKey,
    isInit: user.isInit,
    open2FA: user.open2FA,
    secret: user.secret,
    token: ""
  };
}
