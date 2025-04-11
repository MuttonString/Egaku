import { Input, Layout, Menu } from 'antd';
import { useTranslation } from 'react-i18next';
import styles from './index.module.less';
import classnames from '../utils/classnames';
import { MenuProps } from 'antd/lib';

const { Header, Content } = Layout;
const {Search} = Input;
type MenuItem = Required<MenuProps>['items'][number];

export default function PageLayout() {
  const { t } = useTranslation();

  const items: MenuItem[] = [
    {
      label: t('layout.menu.recommend'),
      key: 'recommend',
    },
    {
      label: t('layout.menu.follow'),
      key: 'follow',
    },
    {
      label: t('layout.menu.article'),
      key: 'article',
    },
    {
      label: t('layout.menu.video'),
      key: 'video',
    },
  ];

  return (
    <Layout className={styles.layout}>
      <Header className={classnames('bgMenu', styles.header)}>
        <div className={styles.logo}>Logo</div>
        <Menu mode="horizontal" items={items} className={styles.menu} />
        <Search maxLength={50} className={styles.search} />
      </Header>
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
