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

import { v4 } from "uuid";

export function timeUuid() {
  let uuid = v4().replace(/-/gim, "");
  const t = new Date().getTime() + "";
  uuid = uuid + t;
  return uuid;
}
