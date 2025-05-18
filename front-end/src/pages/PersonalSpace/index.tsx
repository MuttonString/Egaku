import { Col, Row, Tabs, TabsProps } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import styles from './index.module.less';
import { useTranslation } from 'react-i18next';
import ArticleTab from './tabs/ArticleTab';
import { useThrottleFn } from 'ahooks';
import VideoTab from './tabs/VideoTab';

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

  const items: TabsProps['items'] = useMemo(
    () => [
      {
        key: 'collection',
        label: t('personal.tabs.collection'),
      },
      {
        key: 'submission',
        label: t('personal.tabs.submission'),
      },
      {
        key: 'reply',
        label: (
          <span className={styles.divider}>{t('personal.tabs.reply')}</span>
        ),
      },
      {
        key: 'like',
        label: t('personal.tabs.like'),
      },
      {
        key: 'notice',
        label: t('personal.tabs.notice'),
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

  return (
    <Row className={styles.page}>
      <Col xs={0} sm={1} md={2} lg={4} />
      <Col xs={24} sm={22} md={20} lg={18} className={styles.content}>
        <Tabs
          tabPosition={isMobile ? 'top' : 'left'}
          className={styles.tabs}
          items={items}
          activeKey={tab}
          onChange={(val) => {
            navigate('/personal/' + val);
          }}
        />
      </Col>
    </Row>
  );
}
