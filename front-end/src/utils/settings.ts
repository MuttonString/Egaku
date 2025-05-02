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
import { Dispatch, SetStateAction } from 'react';
import { Locale } from 'antd/es/locale';
import localforage from 'localforage';
import { RcFile } from 'antd/es/upload';

export enum SETTINGS {
  LANGUAGE = 'lang',
  DARKMODE = 'darkmode',
  BACKGROUND = 'bg',
  THEME_COLOR = 'theme',
  DARKEN_IMAGE = 'dakren',
}

export const THEME_COLORS = [
  '#f5222d',
  '#fa541c',
  '#fa8c16',
  '#faad14',
  '#fadb14',
  '#a0d911',
  '#52c41a',
  '#13c2c2',
  '#1677ff',
  '#2f54eb',
  '#722ed1',
  '#eb2f96',
];

export const DEFAULT_THEME_COLOR = 1;

interface SetActions {
  setLocale?: Dispatch<SetStateAction<Locale | undefined>>;
  setDarkmode?: Dispatch<SetStateAction<boolean>>;
  setThemeColor?: Dispatch<SetStateAction<string>>;
  setBackgroundImageFileName?: Dispatch<SetStateAction<string>>;
}

let globalSetActions: SetActions = {};

/**
 * 初始化设置
 * @param setActions 各种useState的setStateAction返参
 */
export async function init(setActions: SetActions) {
  globalSetActions = { ...globalSetActions, ...setActions };

  changeLanguage(localStorage.getItem(SETTINGS.LANGUAGE) as LANGUAGE, false);
  window.addEventListener('languagechange', () => {
    if (!localStorage.getItem(SETTINGS.LANGUAGE)) changeLanguage(null, false);
  });

  changeDarkmode(localStorage.getItem(SETTINGS.DARKMODE), false);
  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', () => {
      if (!localStorage.getItem(SETTINGS.DARKMODE)) changeDarkmode(null, false);
    });

  changeBackground(
    await localforage.getItem<RcFile>(SETTINGS.BACKGROUND),
    false
  );

  changeThemeColor(localStorage.getItem(SETTINGS.THEME_COLOR), false);

  changeDarkenBackgroundImage(
    localStorage.getItem(SETTINGS.DARKEN_IMAGE),
    false
  );
}

/**
 * 更改页面语言
 * @param lang 页面支持的语言，该参数为空则为浏览器默认
 * @param save 是否将更改保存到localStorage，默认为true
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

  switch (lang) {
    case LANGUAGE.ZH_HANS:
      dayjs.locale('zh-cn');
      await i18n.changeLanguage(LANGUAGE.ZH_HANS);
      globalSetActions.setLocale?.(zhCN);
      html.lang = LANGUAGE.ZH_HANS;
      break;
    case LANGUAGE.ZH_HANT:
      dayjs.locale('zh-tw');
      await i18n.changeLanguage(LANGUAGE.ZH_HANT);
      globalSetActions.setLocale?.(zhTW);
      html.lang = LANGUAGE.ZH_HANT;
      break;
    case LANGUAGE.JA:
      dayjs.locale('ja');
      await i18n.changeLanguage(LANGUAGE.JA);
      globalSetActions.setLocale?.(jaJP);
      html.lang = LANGUAGE.JA;
      break;
    default:
      dayjs.locale('en');
      await i18n.changeLanguage(LANGUAGE.EN);
      globalSetActions.setLocale?.(enUS);
      html.lang = LANGUAGE.EN;
      break;
  }
}

/**
 * 更改页面黑暗模式状态
 * @param darkmode 页面是否为黑暗模式，该参数为空则为浏览器默认
 * @param save 是否将更改保存到localStorage，默认为true
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
  globalSetActions.setDarkmode?.(darkmode);
  document.querySelector('html')!.dataset.darkmode = darkmode.toString();
  changeDarkenBackgroundImage(
    localStorage.getItem(SETTINGS.DARKEN_IMAGE),
    false
  );
}

/**
 * 更改页面背景图片
 * @param img 背景图片file对象，该参数为空则为默认图片
 * @param save 是否将更改保存到localforage，默认为true
 */
export async function changeBackground(img?: RcFile | null, save = true) {
  let bg: string;
  if (img) {
    if (save) localforage.setItem(SETTINGS.BACKGROUND, img);
    bg = `url(${URL.createObjectURL(img)})`;
  } else {
    if (save) localforage.removeItem(SETTINGS.BACKGROUND);
    bg = '';
  }

  globalSetActions.setBackgroundImageFileName?.(img?.name || '');
  document.querySelector('body')!.style.backgroundImage = bg;
  changeDarkenBackgroundImage(
    localStorage.getItem(SETTINGS.DARKEN_IMAGE),
    false
  );
}

/**
 * 更改是否在黑暗模式变暗背景图片
 * @param darken 是否变暗背景图片
 * @param save 是否将更改保存到localStorage，默认为true
 */
export function changeDarkenBackgroundImage(
  darken?: boolean | string | null,
  save = true
) {
  if (darken === 'false' || darken === false) darken = false;
  else darken = true;

  if (save) localStorage.setItem(SETTINGS.DARKEN_IMAGE, darken.toString());
  const overlay = 'linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), ';
  const bodyStyle = document.querySelector('body')!.style;
  bodyStyle.backgroundImage = bodyStyle.backgroundImage.replace(overlay, '');
  if (darken && document.querySelector('html')!.dataset.darkmode === 'true')
    bodyStyle.backgroundImage = overlay + bodyStyle.backgroundImage;
}

/**
 * 更改组件主题色
 * @param id 颜色id，该参数为空则为默认值6
 * @param save 是否将更改保存到localStorage，默认为true
 */
export function changeThemeColor(id?: number | string | null, save = true) {
  if (id === null || id === undefined) {
    id = DEFAULT_THEME_COLOR;
  } else {
    if (typeof id === 'string') {
      id = parseInt(id);
      if (!(id >= 0 && id < THEME_COLORS.length)) {
        id = DEFAULT_THEME_COLOR;
      }
    }
  }

  if (save) localStorage.setItem(SETTINGS.THEME_COLOR, id.toString());
  const themeColor = THEME_COLORS[id];
  globalSetActions.setThemeColor?.(themeColor);
  document
    .querySelector('html')!
    .style.setProperty('--primary-color', themeColor);
}
