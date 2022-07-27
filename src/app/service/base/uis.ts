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
