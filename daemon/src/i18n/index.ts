// I18n init configuration (Daemon)
// If you want to add the language of your own country, you need to add the code here.

// import i18next from "i18next";
//
// import zh_cn from "@languages/zh_CN.json";
// import en_us from "@languages/en_US.json";
// import zh_tw from "@languages/zh_TW.json";
// import ja_JP from "@languages/ja_JP.json";
// import es_ES from "@languages/es_ES.json";
// import fr_FR from "@languages/fr_FR.json";
// import ru_RU from "@languages/ru_RU.json";
// import ko_KR from "@languages/ko_KR.json";
// import de_DE from "@languages/de_DE.json";
// import pt_BR from "@languages/pt_BR.json";
// import th_TH from "@languages/th_TH.json";
//
// i18next.init({
//   interpolation: {
//     escapeValue: false
//   },
//   lng: "en_us",
//   fallbackLng: "en_us",
//   resources: {
//     en_us: {
//       translation: en_us
//     },
//     zh_cn: {
//       translation: zh_cn
//     },
//     zh_tw: {
//       translation: zh_tw
//     },
//     ja_jp: {
//       translation: ja_JP
//     },
//     es_es: {
//       translation: es_ES
//     },
//     fr_fr: {
//       translation: fr_FR
//     },
//     ru_ru: {
//       translation: ru_RU
//     },
//     ko_kr: {
//       translation: ko_KR
//     },
//     de_de: {
//       translation: de_DE
//     },
//     pt_br: {
//       translation: pt_BR
//     },
//     th_th: {
//       translation: th_TH
//     }
//   }
// });
//
// // alias
// const $t = i18next.t;
//
// export { $t, i18next };

import { join, resolve } from "node:path";
import { readFileSync } from "node:fs";

class Locale {
  public static DefaultLocale: string = "en_us";
  public static language: string = Locale.DefaultLocale;
  private static UserLocale: { [user_uuid: string]: string } = {
    [Locale.language]: JSON.parse(Locale.ReadLanguageFile(Locale.DefaultLocale))
  }
  private static RegExp: RegExp = /\{{*.+}}/g

  private static BuildLanguagePath(locale: string): string {
    return join(resolve('../'), 'languages', `${locale}.json`);
  }

  private static Parser(text: string, data: { [key: string]: any }): string {
    const key: string = String(Reflect.ownKeys({ ...data })[0]);
    if (text.match(Locale.RegExp)?.[0].includes(key as string)) {
      return text.replace(Locale.RegExp, data[key]);
    }
    return text;
  }

  public static ReadLanguageFile(locale: string): string {
    return readFileSync(Locale.BuildLanguagePath(locale), {
      encoding: "utf-8",
      flag: "r"
    });
  }

  public static changeLanguage(locale: string, user_uuid: string = Locale.language): void {
    Locale.UserLocale[user_uuid] = JSON.parse(Locale.ReadLanguageFile(locale));
  }
  public static t(...args: any[]): string {
    const [text, data, user_uuid] = args;

    switch (args.length) {
      case 1: {
        return Locale.UserLocale[Locale.language][text];
      }

      case 2: {
        if (Locale.UserLocale[data] !== void 0) {
          return Locale.UserLocale[data][text]
        } else {
          return Locale.Parser(Locale.UserLocale[Locale.language][text], data);
        }
      }

      case 3: {
        return Locale.Parser(Locale.UserLocale[user_uuid][text], data);
      }

       default: {
        return `${void 0}`;
      }
    }
  }
}

export { Locale as i18next }
export const $t: (...args: any[]) => string = Locale.t
