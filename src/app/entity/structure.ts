/*
  Copyright (C) 2022 Suwings <Suwings@outlook.com>

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU Affero General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.
  
  According to the AGPL, it is forbidden to delete all copyright notices, 
  and if you modify the source code, you must open source the
  modified source code.

  版权所有 (C) 2022 Suwings <Suwings@outlook.com>

  该程序是免费软件，您可以重新分发和/或修改据 GNU Affero 通用公共许可证的条款，
  由自由软件基金会，许可证的第 3 版，或（由您选择）任何更高版本。

  根据 AGPL 与用户协议，您必须保留所有版权声明，如果修改源代码则必须开源修改后的源代码。
  可以前往 https://mcsmanager.com/ 阅读用户协议，申请闭源开发授权等。
*/

import path from "path";
import fs from "fs-extra";

// The data model class is used as an abstract relationship between the data and the real file.
// All the data stored by the data model is serialized into JSON format and stored in the file.
export class DataStructure {
  __filename__: string;

  [_: string]: any;

  constructor(filename: string) {
    this.__filename__ = filename + ".json";
  }

  load() {
    if (!fs.existsSync(this.__filename__)) return;
    let data = fs.readFileSync(this.__filename__, "utf-8");
    let ele = JSON.parse(data);
    for (var key in ele) {
      this[key] = ele[key];
    }
  }

  save() {
    if (!fs.existsSync(this.__filename__)) {
      fs.mkdirsSync(path.dirname(this.__filename__));
    }
    fs.writeFileSync(this.__filename__, JSON.stringify(this, null, 4), { encoding: "utf-8" });
  }

  del() {
    if (fs.existsSync(this.__filename__)) fs.removeSync(this.__filename__);
  }

  exists(): boolean {
    return fs.existsSync(this.__filename__);
  }
}
