// I18n init configuration (Web Panel)
// If you want to add the language of your own country, you need to add the code here.

import i18next from "i18next";

import zh_cn from "@languages/zh_CN.json";
import en_us from "@languages/en_US.json";
import zh_tw from "@languages/zh_TW.json";
import ja_JP from "@languages/ja_JP.json";
import es_ES from "@languages/es_ES.json";
import fr_FR from "@languages/fr_FR.json";
import ru_RU from "@languages/ru_RU.json";
import ko_KR from "@languages/ko_KR.json";
import de_DE from "@languages/de_DE.json";

i18next.init({
  interpolation: {
    escapeValue: false
  },
  lng: "en_us",
  fallbackLng: "en_us",
  resources: {
    en_us: {
      translation: en_us
    },
    zh_cn: {
      translation: zh_cn
    },
    zh_tw: {
      translation: zh_tw
    },
    ja_jp: {
      translation: ja_JP
    },
    es_es: {
      translation: es_ES
    },
    fr_fr: {
      translation: fr_FR
    },
    ru_ru: {
      translation: ru_RU
    },
    ko_kr: {
      translation: ko_KR
    },
    de_de: {
      translation: de_DE
    }
  }
});

// alias
const $t = i18next.t;

export { $t, i18next };
