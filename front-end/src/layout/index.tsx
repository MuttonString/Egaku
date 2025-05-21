import {
  AutoComplete,
  Avatar,
  Badge,
  Button,
  Drawer,
  Dropdown,
  Flex,
  Input,
  Layout,
  Menu,
} from 'antd';
import type { AutoCompleteProps, MenuProps } from 'antd';
import { useTranslation } from 'react-i18next';
import styles from './index.module.less';
import Animation from '../components/Animation';
import {
  HomeOutlined,
  LoadingOutlined,
  LoginOutlined,
  MenuOutlined,
  RobotFilled,
  SettingFilled,
  UserOutlined,
} from '@ant-design/icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Outlet,
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router';
import Cookies from 'js-cookie';
import LoginModal from '../components/LoginModal';
import type { ILoginModal } from '../components/LoginModal';
import { useRequest, useThrottleFn } from 'ahooks';
import { getInfo } from '../services/user';
import ErrorNotification from '../components/ErrorNotification';
import type { IErrorNotification } from '../components/ErrorNotification';
import SettingsDrawer from '../components/SettingsDrawer';
import type { ISettingsDrawer } from '../components/SettingsDrawer';
import UserModal from '../components/UserModal';
import type { IUserModal } from '../components/UserModal';
import { LOGIN_MODAL_TYPE } from '../components/LoginModal/const';
import AIDrawer from '../components/AIDrawer';
import type { IAIDrawer } from '../components/AIDrawer';

const { Header, Content } = Layout;
type MenuItem = Required<MenuProps>['items'][number];

export default function PageLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation().pathname.split('/')[1];
  const search = useSearchParams()[0].get('search');
  const loginModalRef = useRef<ILoginModal>(null);
  const errorRef = useRef<IErrorNotification>(null);
  const settingsRef = useRef<ISettingsDrawer>(null);
  const userRef = useRef<IUserModal>(null);
  const aiDrawerRef = useRef<IAIDrawer>(null);

  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchVal, setSearchVal] = useState(search || '');
  const [showDot, setShowDot] = useState(location !== 'personal');

  const checkScreenWidth = useThrottleFn(
    () => setIsMobile(document.documentElement.clientWidth <= 768),
    { wait: 300 }
  ).run;
  window.addEventListener('resize', checkScreenWidth);

  const websiteOptions: AutoCompleteProps['options'] = useMemo(
    () => [
      {
        label: (
          <div className={styles.websiteBox}>
            <HomeOutlined className={styles.svg} />
            <div>
              {t('layout.search.label', { website: t('layout.search.this') })}
            </div>
          </div>
        ),
        value: '',
        disabled: !searchVal,
      },
      {
        label: (
          <div className={styles.websiteBox}>
            <img src="/huaban.png" alt="Huaban" />
            <div>{t('layout.search.label', { website: 'Huaban' })}...</div>
          </div>
        ),
        value: 'https://huaban.com/search?q=',
      },
      {
        label: (
          <div className={styles.websiteBox}>
            <img src="/pinterest.png" alt="Pinterest" />
            <div>{t('layout.search.label', { website: 'Pinterest' })}...</div>
          </div>
        ),
        value: 'https://www.pinterest.com/search/pins/?q=',
      },
      {
        label: (
          <div className={styles.websiteBox}>
            <img src="/sketchfab.png" alt="Sketchfab" />
            <div>{t('layout.search.label', { website: 'Sketchfab' })}...</div>
          </div>
        ),
        value: 'https://sketchfab.com/search?q=',
      },
      {
        label: (
          <div className={styles.websiteBox}>
            <img src="/bodiesinmotion.png" alt="Bodiesinmotion" />
            <div>
              {t('layout.search.label', { website: 'Bodiesinmotion' })}...
            </div>
          </div>
        ),
        value: 'https://www.bodiesinmotion.photo/muybridge?search=',
      },
      {
        label: (
          <div className={styles.websiteBox}>
            <img src="/mixamo.png" alt="Mixamo" />
            <div>{t('layout.search.label', { website: 'Mixamo' })}...</div>
          </div>
        ),
        value: 'https://www.mixamo.com/#/?page=1&type=Character&query=',
      },
    ],
    [searchVal, t]
  );

  const {
    data: userData,
    loading: userLoading,
    run: userRun,
  } = useRequest(getInfo, {
    onSuccess(res) {
      if (res.success) {
        if (showDot) {
          let msgCnt = 0;
          Object.keys(res.data.msgNum || {}).forEach((key) => {
            if (res.data.showReminder?.[key as ReminderType]) {
              msgCnt += res.data.msgNum?.[key] || 0;
            }
          });
          setShowDot(msgCnt !== 0);
        }
      }
    },
    onError(err) {
      errorRef.current!.open(err);
    },
  });

  useEffect(() => {
    if (!location && sessionStorage.getItem('token')) navigate('subscription');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    checkScreenWidth();
  }, [checkScreenWidth]);

  const items: MenuItem[] = useMemo(
    () => [
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
    ],
    [navigate, t]
  );

  const logoItem: MenuItem = useMemo(
    () => ({
      label: (
        <div className={styles.logoWithText}>
          <img src="/logo.png" />
          <div>Egaku</div>
        </div>
      ),
      key: 'logo',
      onClick() {
        navigate('/');
      },
    }),
    [navigate]
  );

  const extarItems: MenuItem[] = useMemo(
    () => [
      {
        label: t('layout.menu.subscribe'),
        key: 'subscription',
        onClick() {
          navigate('subscription');
        },
      },
      {
        label: t('layout.menu.personal'),
        key: 'personal',
        onClick() {
          navigate('personal');
          setShowDot(false);
        },
      },
    ],
    [navigate, t]
  );

  const userItems: MenuItem[] = useMemo(
    () => [
      {
        label: (
          <div>
            {t('layout.user.reply')}
            {showDot &&
              userData?.data.showReminder?.reply &&
              !!userData.data.msgNum?.reply && (
                <span className={styles.msgNum}>
                  ({userData?.data.msgNum.reply})
                </span>
              )}
          </div>
        ),
        key: 'reply',
        onClick() {
          setMobileMenuOpen(false);
          setShowDot(false);
          navigate('personal/reply');
        },
      },
      {
        label: (
          <span className={styles.optionDivider}>
            {t('layout.user.submission')}
          </span>
        ),
        key: 'submission',
        onClick() {
          setMobileMenuOpen(false);
          navigate('submission');
        },
      },
      {
        label: t('layout.user.settings'),
        key: 'settings',
        onClick() {
          userRef.current!.open(userData?.data);
          setMobileMenuOpen(false);
        },
      },
      {
        label: t('layout.user.logout'),
        danger: true,
        key: 'logout',
        onClick() {
          Cookies.remove('account');
          Cookies.remove('pwd');
          sessionStorage.removeItem('token');
          setMobileMenuOpen(false);
          window.location.reload();
        },
      },
    ],
    [navigate, showDot, t, userData?.data]
  );

  return (
    <Layout className={styles.layout}>
      <LoginModal ref={loginModalRef} />
      <ErrorNotification ref={errorRef} />
      <SettingsDrawer ref={settingsRef} />
      <UserModal ref={userRef} onSuccess={userRun} />
      <AIDrawer ref={aiDrawerRef} />

      {isMobile ? (
        <Header className={styles.headerMobile}>
          <Button
            type="text"
            className={styles.left}
            onClick={() => setMobileMenuOpen(true)}
          >
            <MenuOutlined />
          </Button>
          <div className={styles.center}>
            <AutoComplete
              className={styles.search}
              options={websiteOptions}
              onSelect={(val) => {
                if (val)
                  window.open(
                    val + encodeURIComponent(searchVal),
                    '_blank',
                    'noopener=yes,noreferrer=yes'
                  );
                else if (searchVal)
                  navigate(`search?search=${encodeURIComponent(searchVal)}`);
              }}
              value={searchVal}
              maxLength={100}
            >
              <Input
                onChange={(e) => setSearchVal(e.target.value)}
                value={searchVal}
                placeholder={t('layout.search.placeholder')}
                onPressEnter={() => {
                  if (searchVal)
                    navigate(`search?search=${encodeURIComponent(searchVal)}`);
                }}
              />
            </AutoComplete>
          </div>
          <Animation animation="bounce">
            <Button
              type="text"
              className={styles.right}
              onClick={() => aiDrawerRef.current!.open()}
            >
              <RobotFilled />
            </Button>
          </Animation>
          <Animation animation="spin">
            <Button
              type="text"
              className={styles.right}
              onClick={() => settingsRef.current!.open()}
            >
              <SettingFilled />
            </Button>
          </Animation>
          <Drawer
            placement="left"
            open={mobileMenuOpen}
            onClose={() => setMobileMenuOpen(false)}
            title={
              userLoading ? (
                <LoadingOutlined size={18} />
              ) : userData?.data.account ? (
                <Dropdown menu={{ items: userItems }} forceRender>
                  <Flex gap="small" className={styles.drawerHeader}>
                    <Badge dot={showDot} offset={[-4, 4]}>
                      <Avatar shape="circle" src={userData.data.avatar}>
                        {(
                          userData.data.nickname || userData.data.account
                        ).substring(0, 2)}
                      </Avatar>
                    </Badge>
                    <div
                      className={styles.username}
                      style={{ color: userData.data.admin ? 'red' : '' }}
                    >
                      {userData?.data.nickname || userData?.data.account}
                    </div>
                  </Flex>
                </Dropdown>
              ) : (
                <Flex
                  gap="small"
                  className={styles.drawerHeader}
                  onClick={() => {
                    loginModalRef.current!.open(LOGIN_MODAL_TYPE.LOGIN);
                  }}
                >
                  <Avatar shape="circle" icon={<UserOutlined />} />
                  <div className={styles.username}>
                    {t('layout.user.noLogin')}
                  </div>
                </Flex>
              )
            }
          >
            <Menu
              mode="vertical"
              items={
                userData?.data.account
                  ? [logoItem, ...items, ...extarItems]
                  : [logoItem, ...items]
              }
              className={styles.verticalMenu}
              selectedKeys={[location]}
              onClick={() => setMobileMenuOpen(false)}
            />
          </Drawer>
        </Header>
      ) : (
        <Header className={styles.header}>
          <Flex className={styles.leftPart}>
            <Animation animation="bounce">
              <div className={styles.logo} onClick={() => navigate('/')} />
            </Animation>
            <Menu
              mode="horizontal"
              items={userData?.data.account ? [...items, ...extarItems] : items}
              className={styles.menu}
              selectedKeys={[location]}
            />
          </Flex>

          <Flex gap="middle">
            <AutoComplete
              className={styles.search}
              options={websiteOptions}
              onSelect={(val) => {
                if (val)
                  window.open(
                    val + encodeURIComponent(searchVal),
                    '_blank',
                    'noopener=yes,noreferrer=yes'
                  );
                else if (searchVal)
                  navigate(`search?search=${encodeURIComponent(searchVal)}`);
              }}
              value={searchVal}
              maxLength={100}
            >
              <Input
                onChange={(e) => setSearchVal(e.target.value)}
                value={searchVal}
                placeholder={t('layout.search.placeholder')}
                onPressEnter={() => {
                  if (searchVal)
                    navigate(`search?search=${encodeURIComponent(searchVal)}`);
                }}
              />
            </AutoComplete>

            <Animation animation="bounce">
              <Button
                type="text"
                className={styles.btn}
                onClick={() => aiDrawerRef.current!.open()}
              >
                <RobotFilled />
              </Button>
            </Animation>
            <Animation animation="spin">
              <Button
                type="text"
                className={styles.btn}
                onClick={() => settingsRef.current!.open()}
              >
                <SettingFilled />
              </Button>
            </Animation>

            {userLoading ? (
              <LoadingOutlined size={18} />
            ) : userData?.data.account ? (
              <Dropdown menu={{ items: userItems }} forceRender>
                <Flex gap="small" className={styles.user} onClick={() => {}}>
                  <Badge dot={showDot} offset={[-4, 4]}>
                    <Avatar shape="circle" src={userData.data.avatar}>
                      {(
                        userData.data.nickname || userData.data.account
                      ).substring(0, 2)}
                    </Avatar>
                  </Badge>
                  <div
                    className={styles.username}
                    style={{ color: userData.data.admin ? 'red' : '' }}
                  >
                    {userData.data.nickname || userData.data.account}
                  </div>
                </Flex>
              </Dropdown>
            ) : (
              <Animation animation="bounce">
                <Button
                  type="text"
                  className={styles.btn}
                  onClick={() =>
                    loginModalRef.current!.open(LOGIN_MODAL_TYPE.LOGIN)
                  }
                >
                  <LoginOutlined />
                </Button>
              </Animation>
            )}
          </Flex>
        </Header>
      )}
      <Content className={styles.content}>
        <Outlet />
      </Content>
    </Layout>
  );
}
