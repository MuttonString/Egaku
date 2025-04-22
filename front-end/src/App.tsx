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

  useEffect(() => {
    init({ setLocale, setDarkmode, setThemeColor });
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
      <PageLayout />
    </ConfigProvider>
  );
}

export default App;
