/*
  Copyright (C) 2022 https://github.com/mcsmanager team.

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU Affero General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.
  
  According to the AGPL, it is forbidden to delete all copyright notices, 
  and if you modify the source code, you must open source the
  modified source code.
*/

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
