import {
  Avatar,
  Button,
  Checkbox,
  Dropdown,
  Input,
  Modal,
  Radio,
  Upload,
} from 'antd';
import type { MenuProps } from 'antd';
import {
  forwardRef,
  Ref,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import styles from './index.module.less';
import ImgCrop from 'antd-img-crop';
import { LoadingOutlined, MailOutlined } from '@ant-design/icons';
import { useRequest } from 'ahooks';
import { uploadFile } from '../../services/common';
import ErrorNotification from '../ErrorNotification';
import type { IErrorNotification } from '../ErrorNotification';
import { USER_SEX } from '../../types/enums';
import LevelTag from '../LevelTag';
import LoginModal from '../LoginModal';
import type { ILoginModal } from '../LoginModal';
import { update } from '../../services/user';
import { imgResize } from '../../utils/imgResize';
import { LOGIN_MODAL_TYPE } from '../LoginModal/const';

type MenuItem = Required<MenuProps>['items'][number];
const { TextArea } = Input;

export interface IUserModal {
  open: (userInfo?: UserGetInfoRes) => void;
}

interface IProps {
  onSuccess?: () => void;
}

function UserModal(props: IProps, ref: Ref<IUserModal>) {
  const { t } = useTranslation();
  const errorRef = useRef<IErrorNotification>(null);
  const resetRef = useRef<ILoginModal>(null);
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<UserGetInfoRes>({});
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState('');
  const [sex, setSex] = useState(0);
  const [showReminder, setShowReminder] = useState<string[]>();
  const [desc, setDesc] = useState('');
  const [processing, setProcessing] = useState(false);

  const { loading: fileLoading, run: fileRun } = useRequest(uploadFile, {
    manual: true,
    onSuccess(res) {
      if (res.success) {
        setAvatar(res.data.url || '');
      } else {
        errorRef.current!.open(res.data.error);
      }
    },
    onError(err) {
      errorRef.current!.open(err);
    },
  });

  const { loading: submitLoading, run: submitRun } = useRequest(update, {
    manual: true,
    onSuccess(res) {
      if (res.success) {
        props.onSuccess?.();
        setOpen(false);
      } else {
        errorRef.current!.open(res.data.error);
      }
    },
    onError(err) {
      errorRef.current!.open(err);
    },
  });

  const avatarItems: MenuItem[] = useMemo(
    () => [
      {
        label: (
          <ImgCrop
            showReset
            resetText={t('userModal.avatar.reset')}
            cropShape="round"
            modalTitle={t('userModal.avatar.crop')}
            beforeCrop={(file) => file.type.startsWith('image')}
          >
            <Upload
              accept="image/*"
              showUploadList={false}
              beforeUpload={async (file) => {
                if (!file.type.startsWith('image')) return false;
                setProcessing(true);
                const newFile = await imgResize(file, 256);
                fileRun(newFile);
                setProcessing(false);
                return false;
              }}
            >
              {t('userModal.avatar.change')}...
            </Upload>
          </ImgCrop>
        ),
        key: 'change',
        onClick() {},
      },
      {
        label: t('userModal.avatar.del'),
        key: 'del',
        danger: true,
        disabled: !avatar,
        onClick() {
          setAvatar('');
        },
      },
    ],
    [avatar, fileRun, t]
  );

  const sexOptions = [
    { value: USER_SEX.UNKNOWN, label: t('userModal.sex.secret') },
    {
      value: USER_SEX.MALE,
      label: t('userModal.sex.male'),
    },
    {
      value: USER_SEX.FEMALE,
      label: t('userModal.sex.female'),
    },
  ];

  const noticeOptions = [
    { value: 'reply', label: t('userModal.remind.reply') },
  ];

  useImperativeHandle(ref, () => ({
    open(userInfo) {
      setOpen(true);
      setUser(userInfo || {});
      setNickname(userInfo?.nickname || userInfo?.account || '');
      setAvatar(userInfo?.avatar || '');
      setSex(userInfo?.sex || 0);
      setShowReminder(
        userInfo?.showReminder &&
          (Object.keys(userInfo.showReminder) as ReminderType[]).filter(
            (val) => userInfo.showReminder?.[val]
          )
      );
      setDesc(userInfo?.desc || '');
    },
  }));

  return (
    <Modal
      title={t('userModal.title')}
      open={open}
      onCancel={() => setOpen(false)}
      maskClosable={false}
      keyboard={false}
      confirmLoading={submitLoading}
      destroyOnHidden
      onOk={() => {
        submitRun({
          nickname,
          sex,
          desc,
          avatar,
          showReminder: {
            reply: !!showReminder?.includes('reply'),
          },
        });
      }}
      footer={(origin) => (
        <div className={styles.footer}>
          <Button
            danger
            onClick={() => resetRef.current!.open(LOGIN_MODAL_TYPE.RESET)}
          >
            {t('userModal.btn.reset')}
          </Button>
          <div className={styles.origin}>{origin}</div>
        </div>
      )}
    >
      <ErrorNotification ref={errorRef} />
      <LoginModal ref={resetRef} />
      <div className={styles.accountRow}>
        <Dropdown menu={{ items: avatarItems }} forceRender>
          <Avatar
            shape="circle"
            src={processing || fileLoading || avatar}
            icon={(processing || fileLoading) && <LoadingOutlined />}
            size={54}
          >
            {nickname.substring(0, 2)}
          </Avatar>
        </Dropdown>
        <div className={styles.nicknamePart}>
          <div className={styles.nickname}>
            <LevelTag exp={user.exp} />
            <Input
              variant="underlined"
              maxLength={50}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              showCount
            />
          </div>
          <div className={styles.account}>
            <div>@{user.account}</div>
            <div className={styles.email}>
              <MailOutlined />
              {user.email}
            </div>
          </div>
        </div>
      </div>
      <div className={styles.row}>
        <div className={styles.title}>{t('userModal.sex.title')}</div>
        <Radio.Group
          value={sex}
          options={sexOptions}
          onChange={(e) => setSex(e.target.value)}
        />
      </div>
      <div className={styles.row}>
        <div className={styles.title}>{t('userModal.remind.title')}</div>
        <Checkbox.Group
          value={showReminder}
          options={noticeOptions}
          onChange={setShowReminder}
        />
      </div>
      <div className={styles.row}>
        <div className={styles.title}>{t('userModal.desc.title')}</div>
        <TextArea
          className={styles.textarea}
          showCount
          maxLength={150}
          value={desc}
          autoSize={{ minRows: 4, maxRows: 4 }}
          onChange={(e) => setDesc(e.target.value.replace(/[\r\n]/g, ''))}
          placeholder={t('userModal.desc.placeholder')}
        />
      </div>
    </Modal>
  );
}

export default forwardRef(UserModal);
