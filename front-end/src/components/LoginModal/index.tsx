import {
  Button,
  Checkbox,
  Form,
  Input,
  Modal,
  ModalProps,
  Progress,
  Space,
} from 'antd';
import {
  forwardRef,
  Ref,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import styles from './index.module.less';
import zxcvbn from 'zxcvbn';

export enum LOGIN_MODAL_TYPE {
  LOGIN = 'login',
  SIGNUP = 'signup',
  RESET = 'reset',
}

export interface ILoginModal {
  open: (type: LOGIN_MODAL_TYPE) => void;
}

function LoginModal(props: ModalProps, ref: Ref<ILoginModal>) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState<string>();
  const [height, setHeight] = useState<string>();
  const [type, setType] = useState<LOGIN_MODAL_TYPE>();
  const [passwordStrength, setPasswordStrength] = useState(-1);

  useImperativeHandle(ref, () => ({
    open(type: LOGIN_MODAL_TYPE) {
      setType(type);
      setOpen(true);
    },
  }));

  useEffect(() => {
    switch (type) {
      case LOGIN_MODAL_TYPE.LOGIN:
        setTitle(t('loginModal.title.login'));
        setHeight('306px');
        break;
      case LOGIN_MODAL_TYPE.SIGNUP:
        setTitle(t('loginModal.title.signup'));
        setHeight('508px');
        break;
      case LOGIN_MODAL_TYPE.RESET:
        setTitle(t('loginModal.title.reset'));
        setHeight('422px');
        break;
    }
  }, [t, type]);

  const content = useMemo(() => {
    switch (type) {
      case LOGIN_MODAL_TYPE.LOGIN:
        return (
          <>
            <Form
              name={LOGIN_MODAL_TYPE.LOGIN}
              layout="vertical"
              validateTrigger="onBlur"
              preserve={false}
            >
              <Form.Item
                label={t('loginModal.form.accountOrEmail')}
                name="accountOrEmail"
                rules={[
                  {
                    required: true,
                    whitespace: true,
                    message: t('loginModal.invalid.required', {
                      label: t('loginModal.form.accountOrEmail'),
                    }),
                  },
                ]}
              >
                <Input maxLength={16} />
              </Form.Item>
              <Form.Item
                label={t('loginModal.form.password')}
                name="password"
                rules={[
                  {
                    required: true,
                    message: t('loginModal.invalid.required', {
                      label: t('loginModal.form.password'),
                    }),
                  },
                ]}
              >
                <Input.Password maxLength={40} />
              </Form.Item>
              <Form.Item name="remember" valuePropName="checked">
                <Checkbox>{t('loginModal.form.remember')}</Checkbox>
              </Form.Item>
              <Form.Item className={styles.btn}>
                <Button type="primary" htmlType="submit" loading={false}>
                  {t('loginModal.btn.login')}
                </Button>
              </Form.Item>
            </Form>
            <div className={styles.bottom}>
              <a
                onClick={(e) => {
                  e.preventDefault();
                  setType(LOGIN_MODAL_TYPE.SIGNUP);
                }}
              >
                {t('loginModal.bottom.signup')}
              </a>
              <a
                onClick={(e) => {
                  e.preventDefault();
                  setType(LOGIN_MODAL_TYPE.RESET);
                }}
              >
                {t('loginModal.bottom.forget')}
              </a>
            </div>
          </>
        );
      case LOGIN_MODAL_TYPE.SIGNUP:
        return (
          <>
            <Form
              name={LOGIN_MODAL_TYPE.SIGNUP}
              layout="vertical"
              validateTrigger="onBlur"
              preserve={false}
            >
              <Form.Item
                className={styles.labelWithTip}
                label={
                  <div className={styles.row}>
                    <div>{t('loginModal.form.account')}</div>
                    <div className={styles.tip}>
                      {t('loginModal.tip.account')}
                    </div>
                  </div>
                }
                name="account"
                rules={[
                  {
                    required: true,
                    whitespace: true,
                    message: t('loginModal.invalid.required', {
                      label: t('loginModal.form.account'),
                    }),
                  },
                  {
                    type: 'string',
                    min: 4,
                    max: 16,
                    message: t('loginModal.invalid.length', {
                      label: t('loginModal.form.account'),
                      len: '4~16',
                    }),
                  },
                  {
                    type: 'string',
                    pattern: /^[a-zA-Z0-9_]+$/,
                    message: t('loginModal.invalid.account'),
                  },
                ]}
                validateFirst
              >
                <Input maxLength={16} />
              </Form.Item>
              <Form.Item label={t('loginModal.form.email')}>
                <Space.Compact className={styles.inputWithBtn}>
                  <Form.Item
                    name="email"
                    rules={[
                      {
                        required: true,
                        whitespace: true,
                        message: t('loginModal.invalid.required', {
                          label: t('loginModal.form.email'),
                        }),
                      },
                      { type: 'email', message: t('loginModal.invalid.email') },
                    ]}
                    validateFirst
                    noStyle
                  >
                    <Input />
                  </Form.Item>
                  <Button>{t('loginModal.btn.code')}</Button>
                </Space.Compact>
              </Form.Item>
              <Form.Item
                label={t('loginModal.form.code')}
                name="code"
                rules={[
                  {
                    required: true,
                    message: t('loginModal.invalid.required', {
                      label: t('loginModal.form.code'),
                    }),
                  },
                ]}
              >
                <Input.OTP formatter={(str) => str.toUpperCase()} />
              </Form.Item>
              <Form.Item
                className={styles.labelWithTip}
                label={
                  <div className={styles.row}>
                    <div>{t('loginModal.form.password')}</div>
                    <div
                      style={{
                        display: passwordStrength >= 0 ? 'flex' : 'none',
                      }}
                    >
                      {t('loginModal.tip.strength')}
                      <Progress
                        showInfo={false}
                        steps={5}
                        percent={passwordStrength * 20 + 20}
                        strokeColor={
                          ['red', 'orange', 'yellow', 'greenyellow', 'green'][
                            passwordStrength
                          ]
                        }
                        className={styles.progress}
                      />
                    </div>
                  </div>
                }
                name="password"
                rules={[
                  {
                    required: true,
                    message: t('loginModal.invalid.required', {
                      label: t('loginModal.form.password'),
                    }),
                  },
                  {
                    type: 'string',
                    min: 6,
                    max: 40,
                    message: t('loginModal.invalid.length', {
                      label: t('loginModal.form.password'),
                      len: '6~40',
                    }),
                  },
                ]}
                validateFirst
              >
                <Input.Password
                  maxLength={40}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val.length < 6 || val.length > 40)
                      return setPasswordStrength(-1);
                    setPasswordStrength(zxcvbn(val).score);
                  }}
                />
              </Form.Item>
              <Form.Item
                label={t('loginModal.form.passwordAgain')}
                name="password2"
                rules={[
                  ({ getFieldValue }) => ({
                    validator(_, val) {
                      return val === getFieldValue('password')
                        ? Promise.resolve()
                        : Promise.reject(t('loginModal.invalid.pwdNotSame'));
                    },
                  }),
                ]}
              >
                <Input.Password maxLength={40} />
              </Form.Item>
              <Form.Item className={styles.btn}>
                <Button type="primary" htmlType="submit" loading={false}>
                  {t('loginModal.btn.signup')}
                </Button>
              </Form.Item>
            </Form>
            <div className={styles.bottom}>
              <a
                onClick={(e) => {
                  e.preventDefault();
                  setType(LOGIN_MODAL_TYPE.LOGIN);
                }}
              >
                {t('loginModal.bottom.login')}
              </a>
            </div>
          </>
        );
      case LOGIN_MODAL_TYPE.RESET:
        return (
          <>
            <Form
              name={LOGIN_MODAL_TYPE.RESET}
              layout="vertical"
              validateTrigger="onBlur"
              preserve={false}
            >
              <Form.Item label={t('loginModal.form.email')}>
                <Space.Compact className={styles.inputWithBtn}>
                  <Form.Item
                    name="email"
                    rules={[
                      {
                        required: true,
                        whitespace: true,
                        message: t('loginModal.invalid.required', {
                          label: t('loginModal.form.email'),
                        }),
                      },
                      { type: 'email', message: t('loginModal.invalid.email') },
                    ]}
                    validateFirst
                    noStyle
                  >
                    <Input />
                  </Form.Item>
                  <Button>{t('loginModal.btn.code')}</Button>
                </Space.Compact>
              </Form.Item>
              <Form.Item
                label={t('loginModal.form.code')}
                name="code"
                rules={[
                  {
                    required: true,
                    message: t('loginModal.invalid.required', {
                      label: t('loginModal.form.code'),
                    }),
                  },
                ]}
              >
                <Input.OTP formatter={(str) => str.toUpperCase()} />
              </Form.Item>
              <Form.Item
                className={styles.labelWithTip}
                label={
                  <div className={styles.row}>
                    <div>{t('loginModal.form.password')}</div>
                    <div
                      style={{
                        display: passwordStrength >= 0 ? 'flex' : 'none',
                      }}
                    >
                      {t('loginModal.tip.strength')}
                      <Progress
                        showInfo={false}
                        steps={5}
                        percent={passwordStrength * 20 + 20}
                        strokeColor={
                          ['red', 'orange', 'yellow', 'greenyellow', 'green'][
                            passwordStrength
                          ]
                        }
                        className={styles.progress}
                      />
                    </div>
                  </div>
                }
                name="password"
                rules={[
                  {
                    required: true,
                    message: t('loginModal.invalid.required', {
                      label: t('loginModal.form.password'),
                    }),
                  },
                  {
                    type: 'string',
                    min: 6,
                    max: 40,
                    message: t('loginModal.invalid.length', {
                      label: t('loginModal.form.password'),
                      len: '6~40',
                    }),
                  },
                ]}
                validateFirst
              >
                <Input.Password
                  maxLength={40}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val.length < 6 || val.length > 40)
                      return setPasswordStrength(-1);
                    setPasswordStrength(zxcvbn(val).score);
                  }}
                />
              </Form.Item>
              <Form.Item
                label={t('loginModal.form.passwordAgain')}
                name="password2"
                rules={[
                  ({ getFieldValue }) => ({
                    validator(_, val) {
                      return val === getFieldValue('password')
                        ? Promise.resolve()
                        : Promise.reject(t('loginModal.invalid.pwdNotSame'));
                    },
                  }),
                ]}
              >
                <Input.Password maxLength={40} />
              </Form.Item>
              <Form.Item className={styles.btn}>
                <Button type="primary" htmlType="submit" loading={false}>
                  {t('loginModal.btn.reset')}
                </Button>
              </Form.Item>
            </Form>
            <div className={styles.bottom}>
              <a
                onClick={(e) => {
                  e.preventDefault();
                  setType(LOGIN_MODAL_TYPE.LOGIN);
                }}
              >
                {t('loginModal.bottom.back')}
              </a>
            </div>
          </>
        );
    }
  }, [t, type, passwordStrength]);

  return (
    <Modal
      open={open}
      maskClosable={false}
      footer={null}
      onCancel={() => setOpen(false)}
      title={title}
      destroyOnHidden
      {...props}
    >
      <div className={styles.modal} style={{ height }}>
        {content}
      </div>
    </Modal>
  );
}

export default forwardRef(LoginModal);
