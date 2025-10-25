// I18n init configuration (Frontend)

import { updateSettings } from "@/services/apis";
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
  }
  // These languages are temporarily not supported due to low user volume and long-term lack of maintenance
  // {
  //   label: `Français`,
  //   value: `fr_fr`
  // },
  // {
  //   label: `Português Brasileiro`,
  //   value: `pt_br`
  // },
  // {
  //   label: `Thai`,
  //   value: `th_th`
  // }
  // {
  //   label: `Español`,
  //   value: `es_es`
  // },
  // {
  //   label: `한국어`,
  //   value: `ko_kr`
  // },
];

export enum SUPPORTED_LANGS_ENUM {
  "EN_US" = "en_us",
  "ZH_CN" = "zh_cn",
  "ZH_TW" = "zh_tw",
  "JA_JP" = "ja_jp",
  "RU_RU" = "ru_ru",
  "DE_DE" = "de_de"
}

export function getLanguage(locale_code: SUPPORTED_LANGS_ENUM): string {
  return (
    SUPPORTED_LANGS.find(({ value  }): boolean => value === locale_code)?.label ??
    SUPPORTED_LANGS.at(0)?.label as string
  );
}


export const USER_UUID_KEY = "USER_UUID";
export const LANGUAGE_KEY = "LANGUAGE";

let i18n: I18n;
let userLocale: { [key: string]: string };

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

async function changeLanguage(user_uuid: string, code: string): Promise<void> {
  const request: Request = new Request(`/api/locales/get?user_uuid=${user_uuid}&code=${code}`, {
    method: "GET"
  })
  userLocale = JSON.parse(await getLocale(request));
}

// I18n init configuration
// If you want to add the language of your own country, you need to add the code here.
const messages: Record<string, any> = {};
async function initI18n(lang: string) {
  lang = toStandardLang(lang);

  const langFiles = import.meta.glob("../../../languages/*.json");
  for (const path in langFiles) {
    for (const l of SUPPORTED_LANGS) {
      if (toStandardLang(path).includes(l.value) && typeof langFiles[path] === "function") {
        messages[l.value] = await langFiles[path]();
      }
    }
  }

  await changeLanguage(localStorage.getItem(USER_UUID_KEY) as string, localStorage.getItem(LANGUAGE_KEY) as string);

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

function getLocale(request: Request): Promise<string> {
  return new Promise(async (cb): Promise<void> => {
    fetch(request)
      .then((res: Response) => res.json())
      .then(({ data }) => cb(data));
  })
}

const $t = (...args: any[]): string => {
  return userLocale ? userLocale[args.at(0)] : (i18n.global.t as Function)(...args);
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
