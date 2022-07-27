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

export class UniversalRemoteSubsystem<T> {
  public readonly services: Map<string, T>;

  constructor() {
    this.services = new Map<string, T>();
  }

  setInstance(uuid: string, object: T): void {
    if (this.services.get(uuid)) throw new Error("Instance already exists");
    this.services.set(uuid, object);
  }

  getInstance(uuid: string): T {
    return this.services.get(uuid);
  }

  deleteInstance(uuid: string) {
    return this.services.delete(uuid);
  }

  randdomUuid() {
    return v4().replace(/-/gim, "");
  }
}
