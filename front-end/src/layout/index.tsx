import { Layout } from 'antd';
import { useTranslation } from 'react-i18next';
import styles from './index.module.less';
import classnames from '../utils/classnames';

const { Header, Content } = Layout;

export default function PageLayout() {
  const { t } = useTranslation();
  return (
    <Layout className={styles.layout}>
      <Header className={classnames('bgMenu', styles.header)}></Header>
      <Content className={styles.content}>
        <div className={styles.container}>
          {[...new Array(50)].map((_, idx) => (
            <p
              key={idx}
              style={{
                fontSize: '32px',
                lineHeight: '36px',
                color: 'red',
              }}
            >
              {idx + ': ' + t('test.hello')}
            </p>
          ))}
        </div>
      </Content>
    </Layout>
  );
}
