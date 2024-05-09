// I18n init configuration (Frontend)

import { createI18n } from "vue-i18n";
import { updateSettings } from "@/services/apis";

import enUS from "@languages/en_US.json";

// DO NOT I18N
// If you want to add the language of your own country, you need to add the code here.
export const SUPPORTED_LANGS = [
  {
    label: `English`,
    value: `en_us`
  },
  {
    label: `简体中文`,
    value: `zh_cn`
  },
  {
    label: `繁體中文`,
    value: `zh_tw`
  },
  {
    label: `Français (Google Translation)`,
    value: `fr_fr`
  },
  {
    label: `Español (Google Translation)`,
    value: `es_es`
  },
  {
    label: `Deutsch (Google Translation)`,
    value: `de_de`
  },
  {
    label: `Русский (Google Translation)`,
    value: `ru_ru`
  },
  {
    label: `日本語 (Google Translation)`,
    value: `ja_jp`
  },
  {
    label: `한국어 (Google Translation)`,
    value: `ko_kr`
  }
];

export const LANGUAGE_KEY = "LANGUAGE";

let i18n: any;

export function toStandardLang(lang?: string) {
  if (!lang) return "en_us";
  return lang.replace("-", "_").toLowerCase();
}

export async function initInstallPageFlow(language: string) {
  await updateSettings().execute({
    data: {
      language
    }
  });
  return language;
}

// I18n init configuration
// If you want to add the language of your own country, you need to add the code here.
async function initI18n(lang: string) {
  lang = toStandardLang(lang);

  const messages: Record<string, any> = {
    en_us: enUS
  };
  const langFiles = import.meta.glob("../../../languages/*.json");
  for (const path in langFiles) {
    if (
      lang !== "en_us" &&
      toStandardLang(path).includes(lang) &&
      typeof langFiles[path] === "function"
    ) {
      messages[lang] = await langFiles[path]();
    }
  }

  i18n = createI18n({
    allowComposition: true,
    globalInjection: true,
    locale: lang,
    fallbackLocale: toStandardLang("en_us"),
    messages: messages
  });
}

export function getI18nInstance() {
  return i18n;
}

const getSupportLanguages = (): string[] => {
  return SUPPORTED_LANGS.map((v) => v.value);
};

const searchSupportLanguage = (lang: string) => {
  const findLang = getSupportLanguages().find((v) => v.includes(toStandardLang(lang)));
  if (findLang) return findLang;
  return "en_us";
};

const setLanguage = (lang: string) => {
  lang = toStandardLang(lang);
  localStorage.setItem(LANGUAGE_KEY, lang);
  window.location.reload();
};

const getCurrentLang = (): string => {
  const curLang = String(i18n.global.locale).toLowerCase();
  return searchSupportLanguage(curLang);
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

export {
  setLanguage,
  getCurrentLang,
  searchSupportLanguage,
  $t,
  t,
  initI18n,
  isCN,
  isEN,
  isTW,
  getSupportLanguages
};
