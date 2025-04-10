import i18n, { LANGUAGE } from './i18n';
import dayjs from 'dayjs';

import enUS from 'antd/locale/en_US';
import jaJP from 'antd/locale/ja_JP';
import zhCN from 'antd/locale/zh_CN';
import zhTW from 'antd/locale/zh_TW';

import 'dayjs/locale/en';
import 'dayjs/locale/ja';
import 'dayjs/locale/zh-cn';
import 'dayjs/locale/zh-tw';

export enum SETTINGS {
  LANGUAGE = 'lang',
  DARKMODE = 'darkmode',
  BACKGROUND = 'bg',
}

/**
 * 更改页面语言
 * @param lang 页面支持的语言，该参数为空则为浏览器默认
 * @param save 是否将更改保存到localStorage，默认为true
 * @returns antd的相应Locale
 */
export async function changeLanguage(lang?: LANGUAGE | null, save = true) {
  const html = document.querySelector('html')!;

  if (lang) {
    if (save) localStorage.setItem(SETTINGS.LANGUAGE, lang);
  } else {
    if (save) localStorage.removeItem(SETTINGS.LANGUAGE);
    const defaultLang = navigator.language;
    if (defaultLang.startsWith('zh')) {
      if (['zh-TW', 'zh-HK'].includes(defaultLang)) lang = LANGUAGE.ZH_HANT;
      else lang = LANGUAGE.ZH_HANS;
    } else if (defaultLang.startsWith('ja')) lang = LANGUAGE.JA;
    else lang = LANGUAGE.EN;
  }

  let locale;
  switch (lang) {
    case LANGUAGE.ZH_HANS:
      dayjs.locale('zh-cn');
      locale = zhCN;
      await i18n.changeLanguage(LANGUAGE.ZH_HANS);
      html.lang = LANGUAGE.ZH_HANS;
      break;
    case LANGUAGE.ZH_HANT:
      dayjs.locale('zh-tw');
      locale = zhTW;
      await i18n.changeLanguage(LANGUAGE.ZH_HANT);
      html.lang = LANGUAGE.ZH_HANT;
      break;
    case LANGUAGE.JA:
      dayjs.locale('ja');
      locale = jaJP;
      await i18n.changeLanguage(LANGUAGE.JA);
      html.lang = LANGUAGE.JA;
      break;
    default:
      dayjs.locale('en');
      locale = enUS;
      await i18n.changeLanguage(LANGUAGE.EN);
      html.lang = LANGUAGE.EN;
      break;
  }
  return locale;
}

/**
 * 更改页面黑暗模式状态
 * @param darkmode 页面是否为黑暗模式，该参数为空则为浏览器默认
 * @param save 是否将更改保存到localStorage，默认为true
 * @returns 更改后的黑暗模式状态
 */
export function changeDarkmode(
  darkmode?: boolean | string | null,
  save = true
) {
  if (darkmode === 'true') darkmode = true;
  else if (darkmode === 'false') darkmode = false;

  if (typeof darkmode === 'boolean') {
    if (save) localStorage.setItem(SETTINGS.DARKMODE, darkmode.toString());
  } else {
    localStorage.removeItem(SETTINGS.DARKMODE);
    darkmode = window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return darkmode;
}

/**
 * 更改页面背景图片
 * @param url 背景图片地址，该参数为空则为默认图片
 * @param save 是否将更改保存到localStorage，默认为true
 * @returns 更改后的背景图片url
 */
export function changeBackground(url?: string | null, save = true) {
  if (url) {
    if (save) localStorage.setItem(SETTINGS.BACKGROUND, url);
  } else {
    if (save) localStorage.removeItem(SETTINGS.BACKGROUND);
    url = '/bg.png';
  }

  const body = document.querySelector('body')!;
  body.style.backgroundImage = `url(${url})`;
  return url;
}
