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
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import styles from './index.module.less';
import zxcvbn from 'zxcvbn';
import { useRequest } from 'ahooks';
import { login, reset, sendCode, signup } from '../../services/user';
import ErrorNotification, { IErrorNotification } from '../ErrorNotification';
import SuccessMessage, { ISuccessMessage } from '../SuccessMessage';
import { md5 } from 'js-md5';
import Cookies from 'js-cookie';
import { USER_ERR } from '../../types/enums';
import { useLocation, useNavigate } from 'react-router';

const errMsgMap = {
  [USER_ERR.ACCOUNT_EXIST]: 'loginModal.invalid.existAccount',
  [USER_ERR.EMAIL_EXIST]: 'loginModal.invalid.existEmail',
  [USER_ERR.CODE_ERROR]: 'loginModal.invalid.errCode',
  [USER_ERR.NOT_CORRECT]: 'loginModal.invalid.notCorrect',
  [USER_ERR.EMAIL_NOT_EXIST]: 'loginModal.invalid.notExistEmail',
};

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
  const errorRef = useRef<IErrorNotification>(null);
  const successRef = useRef<ISuccessMessage>(null);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState<string>();
  const [height, setHeight] = useState<string>();
  const [type, setType] = useState<LOGIN_MODAL_TYPE>();
  const [passwordStrength, setPasswordStrength] = useState(-1);
  const [countdown, setCountdown] = useState(0);
  const countdownRef = useRef<number>();

  const [loginForm] = Form.useForm();
  const [signupForm] = Form.useForm();
  const [resetForm] = Form.useForm();

  const isIndex = useLocation().pathname === '/';
  const navigate = useNavigate();

  useImperativeHandle(ref, () => ({
    open(type: LOGIN_MODAL_TYPE) {
      setType(type);
      setPasswordStrength(-1);
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

  const { loading: loginLoading, run: loginRun } = useRequest(login, {
    manual: true,
    onSuccess: (res) => {
      if (res.success) {
        successRef.current!.open(t('loginModal.btn.login'));
        if (loginForm.getFieldValue('remember')) {
          Cookies.set('account', res.data.account, { expires: 7 });
          Cookies.set('pwd', md5(md5(loginForm.getFieldValue('password'))), {
            expires: 7,
          });
        }
        sessionStorage.setItem('token', res.data.token);
        setOpen(false);
        if (isIndex) navigate('/recommendation');
        window.location.reload();
      } else {
        switch (res.data.error) {
          case USER_ERR.NOT_CORRECT:
            return loginForm.setFields([
              {
                name: 'accountOrEmail',
                errors: [t(errMsgMap[res.data.error])],
              },
            ]);
          default:
            errorRef.current!.open(new Error(res.data.error));
        }
      }
    },
  });

  const { loading: signupLoading, run: signupRun } = useRequest(signup, {
    manual: true,
    onSuccess: (res) => {
      if (res.success) {
        successRef.current!.open(t('loginModal.btn.signup'));
        setType(LOGIN_MODAL_TYPE.LOGIN);
      } else {
        switch (res.data.error) {
          case USER_ERR.ACCOUNT_EXIST:
            return signupForm.setFields([
              { name: 'account', errors: [t(errMsgMap[res.data.error])] },
            ]);
          case USER_ERR.EMAIL_EXIST:
            return signupForm.setFields([
              { name: 'email', errors: [t(errMsgMap[res.data.error])] },
            ]);
          case USER_ERR.CODE_ERROR:
            return resetForm.setFields([
              { name: 'code', errors: [t(errMsgMap[res.data.error])] },
            ]);
          default:
            errorRef.current!.open(new Error(res.data.error));
        }
      }
    },
    onError: (err) => {
      errorRef.current!.open(err);
    },
  });

  const { loading: resetLoading, run: resetRun } = useRequest(reset, {
    manual: true,
    onSuccess: (res) => {
      if (res.success) {
        successRef.current!.open(t('loginModal.btn.reset'));
        setType(LOGIN_MODAL_TYPE.LOGIN);
      } else {
        switch (res.data.error) {
          case USER_ERR.EMAIL_NOT_EXIST:
            return signupForm.setFields([
              { name: 'email', errors: [t(errMsgMap[res.data.error])] },
            ]);
          case USER_ERR.CODE_ERROR:
            return resetForm.setFields([
              { name: 'code', errors: [t(errMsgMap[res.data.error])] },
            ]);
          default:
            errorRef.current!.open(new Error(res.data.error));
        }
      }
    },
    onError: (err) => {
      errorRef.current!.open(err);
    },
  });

  const { loading: codeLoading, run: codeRun } = useRequest(sendCode, {
    manual: true,
    onSuccess: (res) => {
      if (res.success) {
        successRef.current!.open(t('loginModal.btn.code'));
        setCountdown(60);
        countdownRef.current = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(countdownRef.current);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        switch (res.data.error) {
          case USER_ERR.EMAIL_EXIST:
            return signupForm.setFields([
              { name: 'email', errors: [t(errMsgMap[res.data.error])] },
            ]);
          case USER_ERR.EMAIL_NOT_EXIST:
            return resetForm.setFields([
              { name: 'email', errors: [t(errMsgMap[res.data.error])] },
            ]);
          default:
            errorRef.current!.open(new Error(res.data.error));
        }
      }
    },
    onError: (err) => {
      errorRef.current!.open(err);
    },
  });

  return (
    <>
      <ErrorNotification ref={errorRef} />
      <SuccessMessage ref={successRef} />
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
          {type === LOGIN_MODAL_TYPE.LOGIN && (
            <>
              <Form
                name={LOGIN_MODAL_TYPE.LOGIN}
                form={loginForm}
                layout="vertical"
                preserve={false}
                onFinish={(val) => {
                  loginRun({
                    accountOrEmail: val.accountOrEmail,
                    password: md5(md5(val.password)),
                  });
                }}
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
                <Form.Item className={styles.btnRow}>
                  <Button
                    className={styles.btn}
                    type="primary"
                    htmlType="submit"
                    loading={loginLoading}
                  >
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
          )}

          {type === LOGIN_MODAL_TYPE.SIGNUP && (
            <>
              <Form
                name={LOGIN_MODAL_TYPE.SIGNUP}
                form={signupForm}
                layout="vertical"
                preserve={false}
                onFinish={(val) => {
                  signupRun({
                    account: val.account,
                    email: val.email,
                    password: md5(md5(val.password)),
                    code: val.code,
                  });
                }}
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
                        {
                          type: 'email',
                          message: t('loginModal.invalid.email'),
                        },
                      ]}
                      validateFirst
                      noStyle
                    >
                      <Input />
                    </Form.Item>
                    <Button
                      disabled={countdown > 0}
                      loading={codeLoading}
                      onClick={async () => {
                        try {
                          await signupForm.validateFields(['email']);
                          codeRun({
                            email: signupForm.getFieldValue('email'),
                            lang: document.querySelector('html')!.lang,
                            isNewEmail: true,
                          });
                        } catch {}
                      }}
                    >
                      {t('loginModal.btn.code')}
                      {countdown > 0 && ` (${countdown})`}
                    </Button>
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
                      signupForm.validateFields(['password2']);
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
                <Form.Item className={styles.btnRow}>
                  <Button
                    className={styles.btn}
                    type="primary"
                    htmlType="submit"
                    loading={signupLoading}
                  >
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
          )}

          {type === LOGIN_MODAL_TYPE.RESET && (
            <>
              <Form
                name={LOGIN_MODAL_TYPE.RESET}
                form={resetForm}
                layout="vertical"
                preserve={false}
                onFinish={(val) => {
                  resetRun({
                    email: val.email,
                    password: md5(md5(val.password)),
                    code: val.code,
                  });
                }}
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
                        {
                          type: 'email',
                          message: t('loginModal.invalid.email'),
                        },
                      ]}
                      validateFirst
                      noStyle
                    >
                      <Input />
                    </Form.Item>
                    <Button
                      disabled={countdown > 0}
                      loading={codeLoading}
                      onClick={async () => {
                        try {
                          await resetForm.validateFields(['email']);
                          codeRun({
                            email: resetForm.getFieldValue('email'),
                            lang: document.querySelector('html')!.lang,
                            isNewEmail: false,
                          });
                        } catch {}
                      }}
                    >
                      {t('loginModal.btn.code')}
                      {countdown > 0 && ` (${countdown})`}
                    </Button>
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
                      resetForm.validateFields(['password2']);
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
                <Form.Item className={styles.btnRow}>
                  <Button
                    className={styles.btn}
                    type="primary"
                    htmlType="submit"
                    loading={resetLoading}
                  >
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
          )}
        </div>
      </Modal>
    </>
  );
}

export default forwardRef(LoginModal);
