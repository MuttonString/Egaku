import { FrownOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import styles from './index.module.less';
import { useLocation } from 'react-router';

export default function NotFound() {
  const { t } = useTranslation();
  const location = useLocation().pathname;
  return (
    <div className={styles.page}>
      <FrownOutlined className={styles.icon} />
      <div className={styles.text}>{t('notFound.title')}</div>
      <div className={styles.path}>{t('notFound.current') + location}</div>
    </div>
  );
}
