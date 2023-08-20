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
    for (const key in ele) {
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
