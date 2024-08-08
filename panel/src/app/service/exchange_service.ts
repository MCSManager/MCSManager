import RemoteServiceSubsystem from "../service/remote_service";
import RemoteRequest from "../service/remote_command";
import user_service from "../service/user_service";
import { customAlphabet } from "nanoid";
import { t } from "i18next";
import { toNumber, toText } from "common";
import { getInstancesByUuid } from "./instance_service";

const getNanoId = customAlphabet(
  "1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  6
);

export enum RequestAction {
  BUY = "buy",
  RENEW = "sell",
  QUERY_INSTANCE = "query_instance"
}

export async function buyOrRenewInstance(
  request_action: RequestAction,
  params: Record<string, any>
) {
  const node_id = toText(params.node_id) ?? "";
  const instance_id = toText(params.instance_id) ?? "";
  const username = toText(params.username) ?? "";
  const hours = toNumber(params.hours) ?? 0;
  const payload = params.payload ?? {};

  const remoteService = RemoteServiceSubsystem.getInstance(node_id || "");
  if (!remoteService?.available) {
    throw new Error(t("TXT_CODE_bed32084"));
  }

  const { request: remoteRequest } = new RemoteRequest(remoteService);

  if (request_action === RequestAction.BUY) {
    payload.endTime = (payload.endTime ? payload.endTime : Date.now()) + hours * 3600 * 1000;
    const { instanceUuid: newInstanceId, config: newInstanceConfig } = await remoteRequest(
      "instance/new",
      payload
    );
    if (!newInstanceId) throw new Error(t("TXT_CODE_728fdabf"));
    const newPassword = getNanoId(12);
    const newUser = await user_service.create({
      userName: username + "-" + getNanoId(6),
      passWord: newPassword,
      permission: 1,
      instances: [
        {
          instanceUuid: newInstanceId,
          daemonId: node_id
        }
      ]
    });

    return {
      instance_id: newInstanceId,
      instance_config: newInstanceConfig,
      username: newUser.userName,
      password: newPassword,
      uuid: newUser.uuid,
      expire: toNumber(newInstanceConfig.endTime)
    };
  }

  if (request_action === RequestAction.RENEW) {
    const instanceInfo = await remoteRequest("instance/detail", {
      instanceUuid: instance_id
    });
    if (!instanceInfo.config) throw new Error(t("TXT_CODE_348c9098"));
    instanceInfo.config.endTime =
      (instanceInfo.config?.endTime ? instanceInfo.config.endTime : Date.now()) +
      hours * 3600 * 1000;
    await remoteRequest("instance/update", {
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
  const uuid = toText(params.uuid) || "";
  const user = user_service.getInstance(uuid);
  if (!user) throw new Error(t("TXT_CODE_903b6c50"));
  return await getInstancesByUuid(uuid, false);
}
