import i18next from "i18next";

import zh_cn from "@languages/zh_CN.json";
import en_us from "@languages/en_US.json";

i18next.init({
  interpolation: {
    escapeValue: false
  },
  lng: "en_us",
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

// alias
const $t = i18next.t;

export { $t, i18next };
