import { ConfigProvider, theme } from 'antd';
import { useEffect, useState } from 'react';
import PageLayout from './layout';
import {
  changeBackground,
  changeDarkmode,
  changeLanguage,
  SETTINGS,
} from './utils/settings';
import { LANGUAGE } from './utils/i18n';
import { Locale } from 'antd/es/locale';

function App() {
  const [locale, setLocale] = useState<Locale>();
  const [darkmode, setDarkmode] = useState(
    changeDarkmode(localStorage.getItem(SETTINGS.DARKMODE), false)
  );

  useEffect(() => {
    changeLanguage(
      localStorage.getItem(SETTINGS.LANGUAGE) as LANGUAGE,
      false
    ).then(setLocale);
    changeBackground(localStorage.getItem(SETTINGS.BACKGROUND), false);

    const changeLang = async () => {
      if (!localStorage.getItem(SETTINGS.LANGUAGE))
        setLocale(await changeLanguage(null, false));
    };
    window.addEventListener('languagechange', changeLang);

    const changeDark = () => {
      if (!localStorage.getItem(SETTINGS.DARKMODE))
        setDarkmode(changeDarkmode(null, false));
    };
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', changeDark);

    return () => {
      window.removeEventListener('languagechange', changeLang);
      media.removeEventListener('change', changeDark);
    };
  }, []);

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
