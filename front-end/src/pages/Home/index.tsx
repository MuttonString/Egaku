import { useTranslation } from 'react-i18next';
import styles from './index.module.less';
import { Button } from 'antd';

export default function Home() {
  const { t } = useTranslation();

  return (
    <div className={styles.page}>
      <div className={styles.logo} />
      <p className={styles.welcome}>{t('home.welcome')}</p>
      <p className={styles.desc}>{t('home.desc')}</p>
      <Button type="primary" className={styles.btn}>
        {t('home.signup')}
      </Button>
      <br />
      <Button className={styles.btn}>{t('home.login')}</Button>
    </div>
  );
}
