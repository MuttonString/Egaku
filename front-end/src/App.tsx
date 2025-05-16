import { ConfigProvider, theme } from 'antd';
import { useEffect, useState } from 'react';
import PageLayout from './layout';
import { init } from './utils/settings';
import { Locale } from 'antd/es/locale';
import showInsetEffect from './utils/showInsetEffect';

function App() {
  const [locale, setLocale] = useState<Locale>();
  const [darkmode, setDarkmode] = useState(false);
  const [themeColor, setThemeColor] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    init({ setLocale, setDarkmode, setThemeColor }).then(() => setDone(true));
  }, []);

  return (
    <ConfigProvider
      theme={{
        token: { colorPrimary: themeColor },
        algorithm: darkmode ? theme.darkAlgorithm : theme.defaultAlgorithm,
      }}
      locale={locale}
      wave={{ showEffect: showInsetEffect }}
    >
      <div id="bg" />
      {done && <PageLayout />}
    </ConfigProvider>
  );
}

export default App;
