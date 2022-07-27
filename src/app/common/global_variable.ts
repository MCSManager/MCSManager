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

export default class GlobalVariable {
  public static readonly map = new Map<string, any>();

  public static set(k: string, v: any) {
    GlobalVariable.map.set(k, v);
  }

  public static get(k: string, def?: any) {
    if (GlobalVariable.map.has(k)) {
      return GlobalVariable.map.get(k);
    } else {
      return def;
    }
  }

  public static del(k: string) {
    return GlobalVariable.map.delete(k);
  }
}
