// Copyright (C) 2022 MCSManager <mcsmanager-dev@outlook.com>

import i18next from "i18next";

import zh_cn from "./language/zh_cn.json";
import en_us from "./language/en_us.json";
import ru_ru from "./language/ru_ru.json";
import pl_pl from "./language/pl_pl.json";

i18next.init({
  lng: "en_us",
  fallbackLng: "en_us",
  resources: {
    zh_cn: {
      translation: zh_cn
    },
    en_us: {
      translation: en_us
    },
    ru_ru: {
      translation: ru_ru
    },
    pl_pl: {
      translation: pl_pl
    }
  }
});

// alias
const $t = i18next.t;

export { $t, i18next };
