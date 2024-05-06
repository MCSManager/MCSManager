import { createI18n } from "vue-i18n";

import enUS from "@languages/en_US.json";
import zhCN from "@languages/zh_CN.json";
import zhTW from "@languages/zh_TW.json";
import jaJP from "@languages/ja_JP.json";
import esES from "@languages/es_ES.json";
import frFR from "@languages/fr_FR.json";
import ruRU from "@languages/ru_RU.json";
import koKR from "@languages/ko_KR.json";

import { updateSettings } from "@/services/apis";

export const LANGUAGE_KEY = "LANGUAGE";

let i18n: any;

export function toStandardLang(lang?: string) {
  if (!lang) return "en_us";
  return lang.replace("-", "_").toLowerCase();
}

export async function initInstallPageFlow() {
  const language = toStandardLang(window.navigator.language);
  await updateSettings().execute({
    data: {
      language
    }
  });
  return language;
}

function initI18n(lang: string) {
  lang = toStandardLang(lang);
  i18n = createI18n({
    allowComposition: true,
    globalInjection: true,
    locale: lang,
    fallbackLocale: toStandardLang("en_us"),
    messages: {
      en_us: enUS,
      zh_cn: zhCN,
      zh_tw: zhTW,
      ja_jp: jaJP,
      es_es: esES,
      fr_fr: frFR,
      ru_ru: ruRU,
      ko_kr: koKR
    }
  });
}

export function getI18nInstance() {
  return i18n;
}

const setLanguage = (lang: string) => {
  lang = toStandardLang(lang);
  localStorage.setItem(LANGUAGE_KEY, lang);
  window.location.reload();
};

const getCurrentLang = (): string => {
  return String(i18n.global.locale).toLowerCase();
};

const isCN = () => {
  return getCurrentLang() === "zh_cn";
};

const isEN = () => {
  return getCurrentLang() === "en_us";
};

const isTW = () => {
  return getCurrentLang() === "zh_tw";
};

const $t = (...args: string[]): string => {
  return (i18n.global.t as Function)(...args);
};
const t = (...args: string[]): string => {
  return (i18n.global.t as Function)(...args);
};

(window as any).setLang = setLanguage;

export { setLanguage, getCurrentLang, $t, t, initI18n, isCN, isEN, isTW };
