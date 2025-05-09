import { useTranslation } from 'react-i18next';
import styles from './index.module.less';
import { Button } from 'antd';
import { useRef, useState } from 'react';
import LoginModal, {
  ILoginModal,
  LOGIN_MODAL_TYPE,
} from '/src/components/LoginModal';

export default function Home() {
  const { t } = useTranslation();
  const modalRef = useRef<ILoginModal>(null);

  return (
    <div className={styles.page}>
      <LoginModal ref={modalRef} />
      <div className={styles.logo} />
      <p className={styles.welcome}>{t('home.welcome')}</p>
      <p className={styles.desc}>{t('home.desc')}</p>
      <Button
        type="primary"
        className={styles.btn}
        onClick={() => modalRef.current?.open(LOGIN_MODAL_TYPE.SIGNUP)}
      >
        {t('home.signup')}
      </Button>
      <br />
      <Button
        className={styles.btn}
        onClick={() => modalRef.current?.open(LOGIN_MODAL_TYPE.LOGIN)}
      >
        {t('home.login')}
      </Button>
    </div>
  );
}
