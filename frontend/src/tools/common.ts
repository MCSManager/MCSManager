import { LoadingOutlined } from "@ant-design/icons-vue";
import { h } from "vue";
import type { JsonData } from "@/types";

export async function sleep(t: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, t));
}

export async function loadingIconFc(fontSize = 24) {
  const indicator = h(LoadingOutlined, {
    style: {
      fontSize: `${fontSize}px`
    },
    spin: true
  });
  return indicator;
}

interface Description {
  [key: string]: any;
}

export function getDescriptionByTitle(description: Description, title: string = "") {
  const arr: string[] = title.split("/");

  function _exec(keys: string[], _description: Description) {
    if (!_description) return null;
    const currentTitle: string | undefined = keys.shift();
    if (keys.length !== 0) {
      return _exec(keys, _description[currentTitle!]);
    } else {
      return _description[currentTitle!];
    }
  }

  return _exec(arr, description);
}

export function jsonToMap(json: JsonData, topTitle = "", map = {}) {
  for (const key in json) {
    let title = null;
    if (topTitle) {
      title = `${topTitle}/${key}`;
    } else {
      title = `${key}`;
    }
    const value = json[key];
    if (value instanceof Array) {
      if (typeof value[0] === "object") {
        jsonToMap(value, title, map);
      } else {
        Object.defineProperty(map, title, {
          enumerable: true,
          configurable: true,
          get() {
            return json[key];
          },
          set(v) {
            json[key] = String(v).split(",");
          }
        });
      }
    } else if (typeof value === "object") {
      jsonToMap(value, title, map);
    } else {
      Object.defineProperty(map, title, {
        enumerable: true,
        configurable: true,
        get() {
          return json[key];
        },
        set(v) {
          const preValue = json[key];
          if (typeof preValue === "number" && !isNaN(Number(v))) return (json[key] = Number(v));
          json[key] = v;
        }
      });
    }
  }
  return map;
}

export function toUnicode(str: string) {
  let value = "";
  for (let i = 0; i < str.length; i++) {
    if (/([\u4E00-\u9FA5]|[\uFE30-\uFFA0])/g.test(str[i])) {
      value += "\\u" + leftZero4(parseInt(str.charCodeAt(i).toString(16)).toString());
    } else {
      value += str[i];
    }
  }
  return value;
}

function leftZero4(str: string) {
  if (str != null && str !== "" && str !== "undefined") {
    if (str.length == 2) {
      return "00" + str;
    }
  }
  return str || "";
}
