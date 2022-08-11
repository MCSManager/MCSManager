// Copyright (C) 2022 MCSManager <mcsmanager-dev@outlook.com>

import userSystem from "./system_user";
import { User } from "../entity/user";

export function isHaveInstance(user: User, serviceUuid: string, instanceUuid: string) {
  if (isTopPermission(user)) return true;
  if (user && user.instances) {
    for (const v of user.instances) {
      if (serviceUuid === v.serviceUuid && instanceUuid === v.instanceUuid) return true;
    }
  }
  return false;
}

export function isTopPermission(user: User) {
  if (!user) return false;
  return user.permission >= 10;
}

export function isTopPermissionByUuid(uuid: string) {
  const user = userSystem.getInstance(uuid);
  return isTopPermission(user);
}

export function isHaveInstanceByUuid(uuid: string, serviceUuid: string, instanceUuid: string) {
  const user = userSystem.getInstance(uuid);
  return isHaveInstance(user, serviceUuid, instanceUuid);
}
