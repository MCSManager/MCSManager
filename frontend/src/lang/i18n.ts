import { createI18n } from "vue-i18n";

import enUS from "@languages/en_US.json";
import zhCN from "@languages/zh_CN.json";

export const LANGUAGE_KEY = "LANGUAGE";

let i18n: any;

function toFrontendLangFormatter(lang: string) {
  return lang.toLowerCase();
}

function initI18n(lang: string) {
  lang = toFrontendLangFormatter(lang);
  i18n = createI18n({
    allowComposition: true,
    globalInjection: true,
    locale: lang,
    fallbackLocale: "en_US",
    messages: {
      en_us: enUS,
      zh_cn: zhCN
    }
  });
}

export function getI18nInstance() {
  return i18n;
}

const setLanguage = (lang: string) => {
  lang = toFrontendLangFormatter(lang);
  localStorage.setItem(LANGUAGE_KEY, lang);
  window.location.reload();
};

const getCurrentLang = (): string => {
  return String(i18n.global.locale).toLowerCase();
};

const $t = (...args: string[]) => {
  return (i18n.global.t as Function)(...args);
};
const t = (...args: string[]) => {
  return (i18n.global.t as Function)(...args);
};

(window as any).setLang = setLanguage;

export { setLanguage, getCurrentLang, $t, t, initI18n };
