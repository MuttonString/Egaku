import { Layout } from 'antd';
import { useTranslation } from 'react-i18next';

export default function PageLayout() {
  const { t } = useTranslation();
  return <Layout>{t('test.hello')}</Layout>;
}
