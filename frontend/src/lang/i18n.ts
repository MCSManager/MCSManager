// I18n init configuration (Frontend)

import { updateSettings } from "@/services/apis";
import { useAppStateStore } from "@/stores/useAppStateStore";
import { createI18n, type I18n } from "vue-i18n";

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
    label: `Русский`,
    value: `ru_ru`
  },
  {
    label: `Deutsch`,
    value: `de_de`
  },
  {
    label: `Français`,
    value: `fr_fr`
  },
  {
    label: `Português Brasileiro`,
    value: `pt_br`
  },
  {
    label: `Thai`,
    value: `th_th`
  },
  {
    label: `Español`,
    value: `es_es`
  },
  {
    label: `한국어`,
    value: `ko_kr`
  }
];

export const LANGUAGE_KEY = "LANGUAGE";

let i18n: I18n;

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
const messages: Record<string, any> = {};
async function initI18n(lang: string) {
  const { state } = useAppStateStore();
  lang = toStandardLang(lang);

  const langFiles = import.meta.glob("../../../languages/*.json");
  for (const path in langFiles) {
    const langFile = langFiles[path];
    if (typeof langFile !== "function") continue;

    if (state.isInstall) {
      if (!toStandardLang(path).includes(lang)) continue;
      messages[lang] = await langFiles[path]();
      break;
    }

    for (const l of SUPPORTED_LANGS) {
      if (!toStandardLang(path).includes(l.value)) continue;
      messages[l.value] = await langFiles[path]();
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

const setLanguage = (lang: string, reload = true) => {
  lang = toStandardLang(lang);
  localStorage.setItem(LANGUAGE_KEY, lang);
  i18n.global.locale = lang;
  if (reload) window.location.reload();
};

const getCurrentLang = (): string => {
  const curLang = String(i18n.global.locale).toLowerCase();
  return searchSupportLanguage(curLang);
};

// Only for first install page
const getInitLanguage = (): string => {
  const curLang = String(i18n.global.locale).toLowerCase();
  const lang = searchSupportLanguage(curLang);
  if (lang !== "zh_cn" && lang !== "zh_tw") {
    return "en_us";
  }
  return lang;
};

const isCN = () => {
  return (
    getCurrentLang() === "zh_cn" ||
    getCurrentLang() === "zh_tw" ||
    window.navigator.language.includes("zh")
  );
};

const isEN = () => {
  return getCurrentLang() === "en_us";
};

const $t = (...args: any[]): string => {
  return (i18n.global.t as Function)(...args);
};
const t = $t;

(window as any).setLang = setLanguage;

export {
  $t,
  getCurrentLang,
  getInitLanguage,
  getSupportLanguages,
  initI18n,
  isCN,
  isEN,
  searchSupportLanguage,
  setLanguage,
  t
};
