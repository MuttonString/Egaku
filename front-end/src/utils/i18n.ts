import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '../languages/en.json';
import ja from '../languages/ja.json';
import zhHans from '../languages/zh-Hans.json';
import zhHant from '../languages/zh-Hant.json';

export enum LANGUAGE {
  EN = 'en',
  ZH_HANS = 'zh-Hans',
  ZH_HANT = 'zh-Hant',
  JA = 'ja',
}

i18n.use(initReactI18next).init({
  resources: {
    [LANGUAGE.EN]: { translation: en },
    [LANGUAGE.ZH_HANS]: { translation: zhHans },
    [LANGUAGE.ZH_HANT]: { translation: zhHant },
    [LANGUAGE.JA]: { translation: ja },
  },
  fallbackLng: LANGUAGE.EN,
});

export default i18n;
