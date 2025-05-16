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
} from 'antd';
import { useTranslation } from 'react-i18next';
import styles from './index.module.less';
import { MenuProps } from 'antd/lib';
import Animation from '../components/Animation';
import {
  LoadingOutlined,
  LoginOutlined,
  MenuOutlined,
  SettingFilled,
  UserOutlined,
} from '@ant-design/icons';
import { useEffect, useRef, useState } from 'react';
import {
  Outlet,
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router';
import Cookies from 'js-cookie';
import LoginModal, {
  ILoginModal,
  LOGIN_MODAL_TYPE,
} from '../components/LoginModal';
import { useRequest, useThrottleFn } from 'ahooks';
import { getInfo } from '../services/user';
import ErrorNotification, {
  IErrorNotification,
} from '../components/ErrorNotification';
import SettingsDrawer, { ISettingsDrawer } from '../components/SettingsDrawer';
import UserModal, { IUserModal } from '../components/UserModal';

const { Header, Content } = Layout;
const { Search } = Input;
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

  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchVal, setSearchVal] = useState(search || '');

  const checkScreenWidth = useThrottleFn(
    () => setIsMobile(document.documentElement.clientWidth <= 768),
    { wait: 300 }
  ).run;
  window.addEventListener('resize', checkScreenWidth);

  const {
    data: userData,
    loading: userLoading,
    run: userRun,
  } = useRequest(getInfo, {
    onError(err) {
      errorRef.current!.open(err);
    },
  });

  useEffect(() => {
    if (!location && sessionStorage.getItem('token'))
      navigate('recommendation');
    checkScreenWidth();
  }, []);

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
    {
      label: (
        <div>
          {t('layout.user.reply')}
          {!!userData?.data.msgNum?.reply && (
            <span className={styles.msgNum}>
              ({userData?.data.msgNum.reply})
            </span>
          )}
        </div>
      ),
      key: 'reply',
      onClick() {
        setMobileMenuOpen(false);
      },
    },
    {
      label: (
        <div>
          {t('layout.user.at')}
          {!!userData?.data.msgNum?.at && (
            <span className={styles.msgNum}>({userData?.data.msgNum.at})</span>
          )}
        </div>
      ),
      key: 'at',
      onClick() {
        setMobileMenuOpen(false);
      },
    },
    {
      label: (
        <div>
          {t('layout.user.like')}
          {!!userData?.data.msgNum?.like && (
            <span className={styles.msgNum}>
              ({userData?.data.msgNum.like})
            </span>
          )}
        </div>
      ),
      key: 'like',
      onClick() {
        setMobileMenuOpen(false);
      },
    },
    {
      label: (
        <div>
          {t('layout.user.notice')}
          {!!userData?.data.msgNum?.notice && (
            <span className={styles.msgNum}>
              ({userData?.data.msgNum.notice})
            </span>
          )}
        </div>
      ),
      key: 'notice',
      onClick() {
        setMobileMenuOpen(false);
      },
    },
    {
      label: (
        <span className={styles.optionDivider}>
          {t('layout.user.settings')}
        </span>
      ),
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
  ];

  return (
    <Layout className={styles.layout}>
      <LoginModal ref={loginModalRef} />
      <ErrorNotification ref={errorRef} />
      <SettingsDrawer ref={settingsRef} />
      <UserModal ref={userRef} onSuccess={userRun} />

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
            <Search
              maxLength={100}
              className={styles.search}
              onSearch={(val) => {
                if (val) navigate(`search?search=${encodeURIComponent(val)}`);
              }}
              onChange={(e) => setSearchVal(e.target.value)}
              value={searchVal}
            />
          </div>
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
                <Dropdown menu={{ items: userItems }}>
                  <Flex gap="small" className={styles.drawerHeader}>
                    <Badge dot={userData.data.hasMsg} offset={[-4, 4]}>
                      <Avatar shape="circle" src={userData.data.avatar}>
                        {(
                          userData.data.nickname || userData.data.account
                        ).substring(0, 2)}
                      </Avatar>
                    </Badge>
                    <div className={styles.username}>
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
              items={[
                {
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
                },
                ...items,
              ]}
              className={styles.verticalMenu}
              selectedKeys={[location]}
              onClick={() => setMobileMenuOpen(false)}
            />
          </Drawer>
        </Header>
      ) : (
        <Header className={styles.header}>
          <Flex>
            <Animation animation="bounce">
              <div className={styles.logo} onClick={() => navigate('/')} />
            </Animation>
            <Menu
              mode="horizontal"
              items={items}
              className={styles.menu}
              selectedKeys={[location]}
            />
          </Flex>

          <Flex gap="middle">
            <Search
              maxLength={100}
              className={styles.search}
              onSearch={(val) => {
                if (val) navigate(`search?search=${encodeURIComponent(val)}`);
              }}
              onChange={(e) => setSearchVal(e.target.value)}
              value={searchVal}
            />

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
              <Dropdown menu={{ items: userItems }}>
                <Flex gap="small" className={styles.user} onClick={() => {}}>
                  <Badge dot={userData.data.hasMsg} offset={[-4, 4]}>
                    <Avatar shape="circle" src={userData.data.avatar}>
                      {(
                        userData.data.nickname || userData.data.account
                      ).substring(0, 2)}
                    </Avatar>
                  </Badge>
                  <div className={styles.username}>
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
