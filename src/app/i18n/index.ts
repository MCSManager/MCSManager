// Copyright (C) 2022 MCSManager Team <mcsmanager-dev@outlook.com>

import i18next from "i18next";

import zh_cn from "./language/zh_cn";
import en_us from "./language/en_us";

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

// alias
const $t = i18next.t;

export { $t, i18next };
