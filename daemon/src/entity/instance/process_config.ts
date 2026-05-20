import fs from "fs-extra";
import path from "path";
import properties from "properties";
import toml from "smol-toml";
import yaml from "yaml";
import { $t } from "../../i18n";

const CONFIG_FILE_ENCODE = "utf-8";
const LONG_MAGIC_PREFIX = "<__long__>";
const FLOAT_MAGIC_PREFIX = "<__float__>";

export interface IProcessConfig {
  fileName: string;
  path: string;
  type: string;
  info: string | null;
  redirect: string;
  from?: string;
  fromLink?: string | null;
}

export class ProcessConfig {
  constructor(public iProcessConfig: IProcessConfig) {
    iProcessConfig.path = path.normalize(iProcessConfig.path);
  }

  // Automatically parse the local file according to the type and return the configuration object
  read(): any {
    const text = fs.readFileSync(this.iProcessConfig.path, { encoding: CONFIG_FILE_ENCODE });
    if (this.iProcessConfig.type === "yml") {
      return yaml.parse(text);
    }
    if (this.iProcessConfig.type == "toml") {
      const table = toml.parse(text, { integersAsBigInt: true });
      const converted = convertTomlReadValues(table);
      return converted;
    }
    if (
      this.iProcessConfig.type === "properties" ||
      this.iProcessConfig.type === "properties_not_unicode"
    ) {
      const regex = /^[ \t]*([^=:\n]+?)[ \t]*=[ \t]*(-?\d+)[ \t]*$/gm;
      let preprocessedText = text.replace(regex, (match, p1, p2) => {
        const num = Number(p2);
        if (num <= 2147483647 && num >= -2147483648) return match;
        return `${p1}=${LONG_MAGIC_PREFIX}${p2}`;
      });
      const props = properties.parse(preprocessedText);
      return props;
    }
    if (this.iProcessConfig.type === "json") {
      return JSON.parse(text);
    }
    if (this.iProcessConfig.type === "txt") {
      return text;
    }
  }

  // Automatically save to the local configuration file according to the parameter object
  write(object: Object) {
    let text = "";
    if (this.iProcessConfig.type === "yml") {
      text = yaml.stringify(object);
    }
    if (this.iProcessConfig.type === "toml") {
      const newObject = JSON.parse(JSON.stringify(object));
      const converted = convertTomlWriteValues(newObject);
      text = toml.stringify(converted, { numbersAsFloat: true });
    }
    if (this.iProcessConfig.type === "properties") {
      const newObject = JSON.parse(JSON.stringify(object));
      const converted = convertPropertiesWriteValues(newObject);
      text = properties.stringify(converted, {
        unicode: true
      });
      text = text.replace(/ = /gim, "=");
      if (this.iProcessConfig.fileName == "server.properties") {
        text = text.replace(/\\\\u/gim, "\\u");
      }
    }
    if (this.iProcessConfig.type === "properties_not_unicode") {
      const newObject = JSON.parse(JSON.stringify(object));
      const converted = convertPropertiesWriteValues(newObject);
      text = properties.stringify(converted, {
        unicode: false
      });
      text = text.replace(/ = /gim, "=");
      text = text.replace(/\\\\u/gim, "\\u");
    }
    if (this.iProcessConfig.type === "json") {
      text = JSON.stringify(object, null, 4);
    }
    if (this.iProcessConfig.type === "txt") {
      text = object.toString();
    }
    if (!text && this.iProcessConfig.type !== "txt")
      throw new Error($t("TXT_CODE_process_config.writEmpty"));
    fs.writeFileSync(this.iProcessConfig.path, text, { encoding: CONFIG_FILE_ENCODE });
  }

  exists() {
    return fs.existsSync(this.iProcessConfig.path);
  }
}

function convertPropertiesWriteValues(obj: any): any {
  if (obj == null) return null;
  if (Array.isArray(obj)) {
    return obj.map(convertPropertiesWriteValues);
  }
  if (typeof obj === "object" && obj.constructor === Object) {
    for (const key in obj) {
      obj[key] = convertPropertiesWriteValues(obj[key]);
    }
    return obj;
  }

  if (typeof obj === "string" && obj.startsWith(LONG_MAGIC_PREFIX)) {
    return obj.replace(LONG_MAGIC_PREFIX, "");
  }
  return obj;
}

function convertTomlReadValues(obj: any): any {
  if (obj == null) return null;
  if (Array.isArray(obj)) {
    return obj.map(convertTomlReadValues);
  }
  if (typeof obj === "object" && obj.constructor === Object) {
    for (const key in obj) {
      obj[key] = convertTomlReadValues(obj[key]);
    }
    return obj;
  }

  if (typeof obj === "bigint") {
    return LONG_MAGIC_PREFIX + String(obj);
  }
  if (typeof obj === "number") {
    const value = FLOAT_MAGIC_PREFIX + String(obj);
    if (value.indexOf(".") != -1) return value;
    return `${value}.0`;
  }
  return obj;
}

function convertTomlWriteValues(obj: any): any {
  if (obj == null) return null;
  if (Array.isArray(obj)) {
    return obj.map(convertTomlWriteValues);
  }
  if (typeof obj === "object" && obj.constructor === Object) {
    for (const key in obj) {
      obj[key] = convertTomlWriteValues(obj[key]);
    }
    return obj;
  }

  if (typeof obj === "number") {
    return BigInt(obj);
  }
  if (typeof obj === "string" && obj.startsWith(LONG_MAGIC_PREFIX)) {
    return BigInt(obj.replace(LONG_MAGIC_PREFIX, ""));
  }
  if (typeof obj === "string" && obj.startsWith(FLOAT_MAGIC_PREFIX)) {
    return Number(obj.replace(FLOAT_MAGIC_PREFIX, ""));
  }
  return obj;
}
