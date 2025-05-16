import { CheckCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import {
  Button,
  Drawer,
  DrawerProps,
  Input,
  Select,
  Space,
  Switch,
  Upload,
} from 'antd';
import {
  forwardRef,
  Ref,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';
import { LANGUAGE } from '../../utils/i18n';
import {
  changeDarkmode,
  changeBackground,
  changeDarkenBackgroundImage,
  THEME_COLORS,
  changeThemeColor,
  DEFAULT_THEME_COLOR,
  SETTINGS,
  init,
  changeLanguage,
} from '../../utils/settings';
import styles from './index.module.less';
import { useTranslation } from 'react-i18next';

export interface ISettingsDrawer {
  open: () => void;
}

function SettingsDrawer(_: DrawerProps, ref: Ref<ISettingsDrawer>) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState(
    localStorage.getItem(SETTINGS.LANGUAGE) || ''
  );
  const [darkmode, setDarkmode] = useState(
    localStorage.getItem(SETTINGS.DARKMODE) || ''
  );
  const [darkenImg, setDarkenImg] = useState(
    localStorage.getItem(SETTINGS.DARKEN_IMAGE) !== 'false'
  );
  const [fileName, setFileName] = useState('');
  const [themeColor, setThemeColor] = useState(
    parseInt(
      (localStorage.getItem(SETTINGS.THEME_COLOR) ||
        DEFAULT_THEME_COLOR) as string
    )
  );

  useEffect(() => {
    init({ setBackgroundImageFileName: setFileName });
  }, []);

  useImperativeHandle(ref, () => ({
    open() {
      setOpen(true);
    },
  }));

  const langOptions = [
    {
      label: t('settingsDrawer.default'),
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
      label: t('settingsDrawer.default'),
      value: '',
    },
    {
      label: t('settingsDrawer.lightColor'),
      value: 'false',
    },
    {
      label: t('settingsDrawer.darkColor'),
      value: 'true',
    },
  ];
  return (
    <Drawer
      title={t('settingsDrawer.title')}
      open={open}
      onClose={() => setOpen(false)}
    >
      <div className={styles.settingGroup}>
        <h3>{t('settingsDrawer.lang')}</h3>
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
        <h3>{t('settingsDrawer.colorMode')}</h3>
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
        <h3>{t('settingsDrawer.bgImg')}</h3>
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
              value={fileName || t('settingsDrawer.select') + '...'}
            />
          </Upload>
          <Button
            onClick={() => {
              setFileName('');
              changeBackground(null);
            }}
            disabled={!fileName}
          >
            <DeleteOutlined />
          </Button>
        </Space.Compact>
      </div>
      <div className={styles.settingGroup}>
        <h3>{t('settingsDrawer.darkenImg')}</h3>
        <Switch
          value={darkenImg}
          onChange={(val) => {
            setDarkenImg(val);
            changeDarkenBackgroundImage(val);
          }}
        />
      </div>
      <div className={styles.settingGroup}>
        <h3>{t('settingsDrawer.theme')}</h3>
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
  );
}

export default forwardRef(SettingsDrawer);
