// I18n init configuration (Frontend)

import { createI18n } from "vue-i18n";
import { updateSettings } from "@/services/apis";

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
    label: `日本語`,
    value: `ja_jp`
  },
  {
    label: `한국어`,
    value: `ko_kr`
  },
  {
    label: `Русский`,
    value: `ru_ru`
  },
  {
    label: `Português Brasileiro`,
    value: `pt_br`
  },
  {
    label: `Français`,
    value: `fr_fr`
  },
  {
    label: `Español`,
    value: `es_es`
  },
  {
    label: `Deutsch`,
    value: `de_de`
  },
  {
    label: `Thai`,
    value: `th_th`
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

  const messages: Record<string, any> = {};
  const langFiles = import.meta.glob("../../../languages/*.json");
  for (const path in langFiles) {
    if (toStandardLang(path).includes(lang) && typeof langFiles[path] === "function") {
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

const isPT = () => {
  return getCurrentLang() === "pt_br";
};

const $t = (...args: any[]): string => {
  return (i18n.global.t as Function)(...args);
};
const t = $t;

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
  isPT,
  getSupportLanguages
};
