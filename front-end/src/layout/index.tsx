import {
  Avatar,
  Badge,
  Button,
  Drawer,
  Dropdown,
  Flex,
  Input,
  Layout,
  Menu,
  Select,
  Space,
  Upload,
} from 'antd';
import { useTranslation } from 'react-i18next';
import styles from './index.module.less';
import { MenuProps } from 'antd/lib';
import Animation from '../components/Animation';
import {
  CheckCircleOutlined,
  SettingFilled,
  UndoOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { LANGUAGE } from '../utils/i18n';
import {
  changeBackground,
  changeDarkmode,
  changeLanguage,
  changeThemeColor,
  DEFAULT_THEME_COLOR,
  init,
  SETTINGS,
  THEME_COLORS,
} from '../utils/settings';
import { Outlet, useLocation, useNavigate } from 'react-router';

const { Header, Content } = Layout;
const { Search } = Input;
type MenuItem = Required<MenuProps>['items'][number];

export default function PageLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation().pathname.split('/')[1];

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hasMsg, setHasMsg] = useState(false);
  const [username, setUsername] = useState('-');
  const [lang, setLang] = useState(
    localStorage.getItem(SETTINGS.LANGUAGE) || ''
  );
  const [darkmode, setDarkmode] = useState(
    localStorage.getItem(SETTINGS.DARKMODE) || ''
  );
  const [fileName, setFileName] = useState('');
  const [themeColor, setThemeColor] = useState(
    parseInt(localStorage.getItem(SETTINGS.THEME_COLOR) as string) ||
      DEFAULT_THEME_COLOR
  );

  useEffect(() => {
    init({ setBackgroundImageFileName: setFileName });
  }, []);

  const langOptions = [
    {
      label: t('layout.drawer.default'),
      value: '',
    },
    {
      label: <span lang={LANGUAGE.EN}>English (US)</span>,
      value: LANGUAGE.EN,
    },
    {
      label: <span lang={LANGUAGE.ZH_HANS}>简体中文 (中国大陆)</span>,
      value: LANGUAGE.ZH_HANS,
    },
    {
      label: <span lang={LANGUAGE.ZH_HANT}>繁體中文 (中國台灣)</span>,
      value: LANGUAGE.ZH_HANT,
    },
    {
      label: <span lang={LANGUAGE.JA}>日本語 (日本)</span>,
      value: LANGUAGE.JA,
    },
  ];

  const colorModeOptions = [
    {
      label: t('layout.drawer.default'),
      value: '',
    },
    {
      label: t('layout.drawer.lightColor'),
      value: 'false',
    },
    {
      label: t('layout.drawer.darkColor'),
      value: 'true',
    },
  ];

  const items: MenuItem[] = [
    {
      label: t('layout.menu.recommend'),
      key: 'recommendation',
      onClick() {
        navigate('recommendation');
      },
    },
    {
      label: t('layout.menu.subscribe'),
      key: 'subscription',
      onClick() {
        navigate('subscription');
      },
    },
    {
      label: t('layout.menu.article'),
      key: 'article',
      onClick() {
        navigate('article');
      },
    },
    {
      label: t('layout.menu.video'),
      key: 'video',
      onClick() {
        navigate('video');
      },
    },
  ];

  const userItems: MenuItem[] = [
    { label: t('layout.user.reply'), key: 'reply' },
    { label: t('layout.user.at'), key: 'at' },
    { label: t('layout.user.like'), key: 'like' },
    { label: t('layout.user.notice'), key: 'notice' },
    {
      label: (
        <span className={styles.optionDivider}>
          {t('layout.user.settings')}
        </span>
      ),
      key: 'settings',
    },
  ];

  return (
    <Layout className={styles.layout}>
      <Header className={styles.header}>
        <Flex gap="middle">
          <div className={styles.logo} onClick={() => navigate('/')}>
            Logo
          </div>
          <Menu
            mode="horizontal"
            items={items}
            className={styles.menu}
            selectedKeys={[location]}
          />
        </Flex>

        <Flex gap="middle">
          <Search maxLength={100} className={styles.search} />

          <Animation animation="spin">
            <Button
              type="text"
              className={styles.btn}
              onClick={() => setDrawerOpen(true)}
            >
              <SettingFilled />
            </Button>
          </Animation>

          <Drawer
            title={t('layout.drawer.title')}
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
          >
            <div className={styles.settingGroup}>
              <h3>{t('layout.drawer.lang')}</h3>
              <Select
                options={langOptions}
                value={lang}
                onChange={(val) => {
                  setLang(val);
                  changeLanguage(val as LANGUAGE);
                }}
              />
            </div>
            <div className={styles.settingGroup}>
              <h3>{t('layout.drawer.colorMode')}</h3>
              <Select
                options={colorModeOptions}
                value={darkmode}
                onChange={(val) => {
                  setDarkmode(val);
                  changeDarkmode(val);
                }}
              />
            </div>
            <div className={styles.settingGroup}>
              <h3>{t('layout.drawer.bgImg')}</h3>
              <Space.Compact>
                <Upload
                  accept="image/png, image/jpeg"
                  beforeUpload={(file) => {
                    setFileName(file.name);
                    changeBackground(file);
                    return false;
                  }}
                  showUploadList={false}
                >
                  <Input
                    readOnly
                    value={fileName || t('layout.drawer.select') + '...'}
                  />
                </Upload>
                <Button
                  onClick={() => {
                    setFileName('');
                    changeBackground(null);
                  }}
                  disabled={!fileName}
                >
                  <UndoOutlined style={{ rotate: '90deg' }} />
                </Button>
              </Space.Compact>
            </div>
            <div className={styles.settingGroup}>
              <h3>{t('layout.drawer.theme')}</h3>
              <div>
                {THEME_COLORS.map((val, idx) => {
                  return (
                    <div
                      key={idx}
                      className={styles.colorBlock}
                      style={{ backgroundColor: val as string }}
                      onClick={() => {
                        setThemeColor(idx);
                        changeThemeColor(idx);
                      }}
                    >
                      {idx === themeColor ? <CheckCircleOutlined /> : undefined}
                    </div>
                  );
                })}
              </div>
            </div>
          </Drawer>

          <Dropdown menu={{ items: userItems }}>
            <Flex gap="small" className={styles.user}>
              <Badge dot={hasMsg} offset={[-4, 4]}>
                <Avatar shape="circle" icon={<UserOutlined />} />
              </Badge>
              <div className={styles.username}>{username}</div>
            </Flex>
          </Dropdown>
        </Flex>
      </Header>
      <Content className={styles.content}>
        <Outlet />
      </Content>
    </Layout>
  );
}
