import { Tabs } from 'antd';
import type { TabsProps } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import styles from './index.module.less';
import { useTranslation } from 'react-i18next';
import ArticleTab from './tabs/ArticleTab';
import { useRequest, useThrottleFn } from 'ahooks';
import VideoTab from './tabs/VideoTab';
import SubmissionTab from './tabs/SubmissionTab';
import CollectionTab from './tabs/CollectionTab';
import ReplyTab from './tabs/ReplyTab';
import { isAdmin } from '../../services/user';
import AuditTab from './tabs/AuditTab';

export default function PersonalSpace() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const params = useParams();
  const [tab, setTab] = useState(params.tab);
  const [isMobile, setIsMobile] = useState(false);

  const checkScreenWidth = useThrottleFn(
    () => setIsMobile(document.documentElement.clientWidth <= 768),
    { wait: 300 }
  ).run;
  window.addEventListener('resize', checkScreenWidth);

  useEffect(() => {
    if (!sessionStorage.getItem('token')) {
      navigate('/', { replace: true });
      return;
    }
    checkScreenWidth();
  }, [checkScreenWidth, navigate]);

  useEffect(() => {
    setTab(params.tab);
  }, [params.tab]);

  const { data: isAdminData } = useRequest(isAdmin);

  const items: TabsProps['items'] = useMemo(
    () => [
      {
        key: 'collection',
        label: t('personal.tabs.collection'),
        children: <CollectionTab />,
      },
      {
        key: 'submission',
        label: t('personal.tabs.submission'),
        children: <SubmissionTab />,
      },
      {
        key: 'reply',
        label: (
          <span className={styles.divider}>{t('personal.tabs.reply')}</span>
        ),
        children: <ReplyTab />,
      },
      {
        key: 'article',
        label: (
          <span className={styles.divider}>{t('personal.tabs.article')}</span>
        ),
        children: <ArticleTab />,
      },
      {
        key: 'video',
        label: t('personal.tabs.video'),
        children: <VideoTab />,
      },
    ],
    [t]
  );

  const adminItems: TabsProps['items'] = useMemo(
    () => [
      {
        key: 'audit',
        label: (
          <span className={styles.divider}>{t('personal.tabs.audit')}</span>
        ),
        children: <AuditTab />,
      },
    ],
    [t]
  );

  return (
    <Tabs
      tabPosition={isMobile ? 'top' : 'left'}
      className={styles.tabs}
      items={isAdminData?.data.isAdmin ? [...items, ...adminItems] : items}
      activeKey={tab}
      onChange={(val) => {
        navigate('/personal/' + val);
      }}
      destroyOnHidden
    />
  );
}
