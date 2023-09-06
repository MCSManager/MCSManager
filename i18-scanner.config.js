const fs = require("fs");
const { crc32 } = require("crc");

const FN_KEY = "TXT_CODE_";

function sortObjectKeys(obj = {}) {
  const sortedObj = {};
  const sortedKeys = Object.keys(obj).sort();
  for (let key of sortedKeys) {
    const value = obj[key];
    if (typeof value === "object" && value !== null) {
      sortedObj[key] = sortObjectKeys(value);
    } else {
      sortedObj[key] = value;
    }
  }
  return sortedObj;
}

module.exports = {
  input: ["./**/*.{ts,vue}", "!**/node_modules/**"],
  output: "./",
  options: {
    debug: false,
    func: false,
    trans: false,
    lngs: ["zh_CN", "en_US"],
    defaultLng: "zh",
    resource: {
      loadPath: "./languages/{{lng}}.json",
      savePath: "./languages/{{lng}}.json",
      jsonIndent: 2,
      lineEnding: "\n"
    },
    removeUnusedKeys: false,
    nsSeparator: false,
    keySeparator: false,
    interpolation: {
      prefix: "{{",
      suffix: "}}"
    }
  },

  transform: function customTransform(file, enc, done) {
    const parser = this.parser;
    const content = fs.readFileSync(file.path, enc);
    let newCode = content;
    parser.parseFuncFromString(content, { list: ["t", "$t"] }, (key, options) => {
      if (String(key).includes(FN_KEY)) {
        return;
      }

      options.defaultValue = key;
      let hashKey = `${FN_KEY}${crc32(key).toString(16)}`;
      console.log("Transform text:", key, "->", hashKey);
      newCode = String(newCode).replace(key, hashKey);
      parser.set(hashKey, options);
    });

    if (newCode != content) fs.writeFileSync(file.path, newCode, { encoding: "utf-8" });

    done();
  }
};
