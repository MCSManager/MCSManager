import { createI18n } from "vue-i18n";

import enUS from "@/lang/en_US.json";
import zhCN from "@/lang/zh_CN.json";

export const LANGUAGE_KEY = "LANGUAGE";

const locale = localStorage.getItem(LANGUAGE_KEY) || "en_US";

const i18n = createI18n({
  allowComposition: true,
  globalInjection: true,
  locale,
  fallbackLocale: "en_US",
  messages: {
    en_US: enUS,
    zh_CN: zhCN,
  },
});

const setLanguage = (lang: string) => {
  localStorage.setItem(LANGUAGE_KEY, lang);
  window.location.reload();
};

const getCurrentLang = () => {
  return i18n.global.locale;
};

const $t = i18n.global.t;
const t = i18n.global.t;

(window as any).setLang = setLanguage;

export { i18n, setLanguage, getCurrentLang, $t, t };
