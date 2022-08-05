// Copyright (C) 2022 MCSManager <mcsmanager-dev@outlook.com>

import { v4 } from "uuid";

export function timeUuid() {
  let uuid = v4().replace(/-/gim, "");
  const t = new Date().getTime() + "";
  uuid = uuid + t;
  return uuid;
}
