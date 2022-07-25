import i18next from "i18next";

const zh_cn = require("./language/zh_cn.json");
const en_us = require("./language/en_us.json");

i18next.init({
  lng: "zh_cn",
  fallbackLng: "en_us",
  resources: {
    zh_cn: {
      translation: zh_cn
    },
    en_us: {
      translation: en_us
    }
  }
});

console.log(i18next.t("common.title"));
console.log(i18next.t("common.title2"));

const $t = i18next.t;

export { $t, i18next };
