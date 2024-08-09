import RemoteServiceSubsystem from "../service/remote_service";
import RemoteRequest from "../service/remote_command";
import user_service from "../service/user_service";
import { customAlphabet } from "nanoid";
import { t } from "i18next";
import { toNumber, toText } from "common";
import { getInstancesByUuid, INSTANCE_STATUS_TEXT } from "./instance_service";

const getNanoId = customAlphabet(
  "1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  6
);

export enum RequestAction {
  BUY = "buy",
  RENEW = "renew",
  QUERY_INSTANCE = "query_instance",
  PING = "ping"
}

export function parseUserName(t?: string) {
  if (!t || typeof t !== "string") return "";
  if (t.startsWith("User-")) return t;
  return `User-${toText(t) ?? ""}`;
}

export async function buyOrRenewInstance(
  request_action: RequestAction,
  params: Record<string, any>
) {
  const node_id = toText(params.node_id) ?? "";
  const instance_id = toText(params.instance_id) ?? "";
  const username = parseUserName(params.username);
  const hours = toNumber(params.hours) ?? 0;
  const payload = params.payload ?? {};

  const remoteService = RemoteServiceSubsystem.getInstance(node_id || "");
  if (!remoteService?.available) {
    throw new Error(t("TXT_CODE_bed32084"));
  }

  const remoteRequest = new RemoteRequest(remoteService);

  if (request_action === RequestAction.BUY) {
    payload.endTime = (payload.endTime ? payload.endTime : Date.now()) + hours * 3600 * 1000;
    payload.nickname = payload.nickname + "-" + getNanoId(6);
    const { instanceUuid: newInstanceId, config: newInstanceConfig } = await remoteRequest.request(
      "instance/new",
      payload
    );
    if (!newInstanceId) throw new Error(t("TXT_CODE_728fdabf"));

    let user = user_service.getUserByUserName(username);
    let newPassword = "";

    if (user) {
      await user_service.edit(user.uuid, {
        instances: [
          ...user.instances,
          {
            instanceUuid: newInstanceId,
            daemonId: node_id
          }
        ]
      });
    } else {
      newPassword = getNanoId(12);
      user = await user_service.create({
        userName: username,
        passWord: newPassword,
        permission: 1,
        instances: [
          {
            instanceUuid: newInstanceId,
            daemonId: node_id
          }
        ]
      });
    }
    return {
      instance_id: newInstanceId,
      instance_config: newInstanceConfig,
      username: user.userName,
      password: newPassword,
      uuid: user.uuid,
      expire: toNumber(newInstanceConfig.endTime)
    };
  }

  if (request_action === RequestAction.RENEW) {
    const instanceInfo = await remoteRequest.request("instance/detail", {
      instanceUuid: instance_id
    });
    if (!instanceInfo.config) throw new Error(t("TXT_CODE_348c9098"));
    instanceInfo.config.endTime =
      (instanceInfo.config?.endTime ? instanceInfo.config.endTime : Date.now()) +
      hours * 3600 * 1000;
    await remoteRequest.request("instance/update", {
      instanceUuid: instance_id,
      config: instanceInfo.config
    });
    return {
      instance_id,
      instance_config: instanceInfo.config,
      expire: toNumber(instanceInfo.config.endTime),
      username: "",
      password: "",
      uuid: ""
    };
  }

  throw new Error(t("TXT_CODE_4aaec75c"));
}

export async function queryInstanceByUserId(params: Record<string, any>) {
  const name = parseUserName(params.username) || "";
  const user = user_service.getUserByUserName(name);
  if (!user) throw new Error(t("TXT_CODE_903b6c50"));

  const { instances = [] } = await getInstancesByUuid(user.uuid, true);
  const newInstancesInfo = instances.map((v) => {
    return {
      name: v.nickname,
      expire: v.endTime,
      status: v.status,
      lines: [
        {
          title: t("TXT_CODE_7e9727bd"),
          value: `${v.info?.currentPlayers}/${v.info?.maxPlayers}`
        },
        {
          title: t("TXT_CODE_f49149d0"),
          value: v.docker?.ports
        }
      ]
    };
  });
  return newInstancesInfo;
}
