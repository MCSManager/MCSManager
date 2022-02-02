/*
  Copyright (C) 2022 Suwings(https://github.com/Suwings)

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  According to the GPL, it is forbidden to delete all copyright notices,
  and if you modify the source code, you must open source the
  modified source code.

  版权所有 (C) 2022 Suwings(https://github.com/Suwings)

  本程序为自由软件，你可以依据 GPL 的条款（第三版或者更高），再分发和/或修改它。
  该程序以具有实际用途为目的发布，但是并不包含任何担保，
  也不包含基于特定商用或健康用途的默认担保。具体细节请查看 GPL 协议。

  根据协议，您必须保留所有版权声明，如果修改源码则必须开源修改后的源码。
  前往 https://mcsmanager.com/ 申请闭源开发授权或了解更多。
*/

// import { v4 } from "uuid";
// import path from "path";
// import fs from "fs-extra";
// import { logger } from "../log";
// import { DataStructure } from "../../entity/structure";

// export class UniversalInstanceSubsystem<T extends DataStructure> {
//   public readonly objects: Map<string, T>;
//   public readonly objectsSize: number;
//   public readonly instanceType: any;
//   public readonly saveDir: string;

//   constructor(saveDir: string, instanceType: any) {
//     this.objects = new Map<string, T>();
//     this.instanceType = instanceType;
//     this.saveDir = saveDir;
//     if (!fs.existsSync(saveDir)) fs.mkdirsSync(saveDir);
//     fs.readdirSync(saveDir).forEach((file) => {
//       const name = path.basename(file);
//       const uuid = name.substring(0, name.indexOf(path.extname(file)));
//       this.setInstance(uuid, new instanceType(uuid));
//     });
//     this.objectsSize = this.objects.size;
//   }

//   setInstance(uuid: string, object: T): void {
//     if (object) {
//       if (this.objects.get(uuid)) throw new Error("Instance already exists");
//       this.objects.set(uuid, object);
//     }
//   }

//   getInstance(uuid: string): T {
//     return this.objects.get(uuid);
//   }

//   createInstance(): T {
//     const uuid = v4().replace(/-/gim, "");
//     const instance = new this.instanceType(uuid);
//     this.setInstance(uuid, instance);
//     return instance;
//   }

//   deleteInstance(uuid: string) {
//     // try {
//     fs.removeSync(path.join(this.saveDir, `${uuid}.json`));
//     return this.objects.delete(uuid);
//     // } catch (err) {
//     //   throw err;
//     // } finally {
//     //   this.objects.delete(uuid);
//     // }
//   }
// }
