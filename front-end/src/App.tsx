import { ConfigProvider, theme } from 'antd';
import { Locale } from 'antd/es/locale';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';

import enUS from 'antd/locale/en_US';
import jaJP from 'antd/locale/ja_JP';
import zhCN from 'antd/locale/zh_CN';
import zhTW from 'antd/locale/zh_TW';

import 'dayjs/locale/en';
import 'dayjs/locale/ja';
import 'dayjs/locale/zh-cn';
import 'dayjs/locale/zh-tw';
import i18n, { LANGUAGE } from './utils/i18n';
import PageLayout from './layout';

function App() {
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const [darkmode, setDarkmode] = useState(media.matches);

  useEffect(() => {
    const changeColorMode = () => setDarkmode(media.matches);
    media.addEventListener('change', changeColorMode);
    return () => media.removeEventListener('change', changeColorMode);
  }, [media]);

  const [lang, setLang] = useState(navigator.language);
  const [locale, setLocale] = useState<Locale>();

  useEffect(() => {
    const changeLang = () => setLang(navigator.language);
    window.addEventListener('languagechange', changeLang);
    return () => window.removeEventListener('languagechange', changeLang);
  }, []);

  useEffect(() => {
    const html = document.querySelector('html')!;
    if (lang.startsWith('zh')) {
      if (['zh-TW', 'zh-HK'].includes(lang)) {
        dayjs.locale('zh-tw');
        setLocale(zhTW);
        i18n.changeLanguage(LANGUAGE.ZH_HANT);
        html.lang = LANGUAGE.ZH_HANT;
      } else {
        dayjs.locale('zh-cn');
        setLocale(zhCN);
        i18n.changeLanguage(LANGUAGE.ZH_HANS);
        html.lang = LANGUAGE.ZH_HANS;
      }
    } else if (lang.startsWith('ja')) {
      dayjs.locale('ja');
      setLocale(jaJP);
      i18n.changeLanguage(LANGUAGE.JA);
      html.lang = LANGUAGE.JA;
    } else {
      dayjs.locale('en');
      setLocale(enUS);
      i18n.changeLanguage(LANGUAGE.EN);
      html.lang = LANGUAGE.EN;
    }
  }, [lang]);

  return (
    <ConfigProvider
      theme={{
        algorithm: darkmode ? theme.darkAlgorithm : theme.defaultAlgorithm,
      }}
      locale={locale}
    >
      <PageLayout />
    </ConfigProvider>
  );
}

export default App;
