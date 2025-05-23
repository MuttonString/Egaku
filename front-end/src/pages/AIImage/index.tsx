import { useRequest } from 'ahooks';
import { Button, Flex, Select, Switch, Image, Upload } from 'antd';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { aiImageProcessing } from '../../services/common';
import ErrorNotification from '../../components/ErrorNotification';
import type { IErrorNotification } from '../../components/ErrorNotification';
import styles from './index.module.less';
import toBase64 from '../../utils/toBase64';

export default function AIImage() {
  const { t } = useTranslation();
  const errorRef = useRef<IErrorNotification>(null);
  const [checked, setChecked] = useState(false);
  const [option, setOption] = useState('coloring');
  const [original, setOriginal] = useState('');
  const [processed, setProcessed] = useState('');

  const options = [
    {
      label: t('aiImage.option.coloring'),
      value: 'coloring',
    },
    {
      label: t('aiImage.option.animization'),
      value: 'animization',
    },
    {
      label: t('aiImage.option.defogging'),
      value: 'defogging',
    },
    {
      label: t('aiImage.option.contrast'),
      value: 'contrast',
    },
    {
      label: t('aiImage.option.scale'),
      value: 'scale',
    },
    {
      label: t('aiImage.option.restore'),
      value: 'restore',
    },
    {
      label: t('aiImage.option.definition'),
      value: 'definition',
    },
    {
      label: t('aiImage.option.colorEnhance'),
      value: 'colorEnhance',
    },
  ];

  const { loading, run } = useRequest(aiImageProcessing, {
    manual: true,
    onSuccess(data) {
      if (data.success) {
        setProcessed(data.data.image!);
        setChecked(true);
      } else {
        errorRef.current!.open(data.data.error);
      }
    },
    onError(err) {
      errorRef.current!.open(err);
    },
  });

  return (
    <Flex vertical gap={16} align="center">
      <ErrorNotification ref={errorRef} />
      <Flex className={styles.operation} align="center" gap={16}>
        <Flex>
          <div>{t('aiImage.switch.original')}</div>
          <Switch
            checked={checked}
            onChange={setChecked}
            disabled={!processed}
          />
          <div className={styles.switchText}>
            {t('aiImage.switch.processed')}
          </div>
        </Flex>
        <Select
          className={styles.select}
          options={options}
          onChange={setOption}
          value={option}
        />
        <Upload
          disabled={loading}
          accept="image/jpg, image/png, image/bmp"
          showUploadList={false}
          beforeUpload={async (file) => {
            if (
              !['image/jpg', 'image/png', 'image/bmp'].some((type) =>
                file.type.startsWith(type)
              )
            )
              return false;
            setOriginal(await toBase64(file));
            setChecked(false);
            setProcessed('');
            return false;
          }}
        >
          <Button disabled={loading}>{t('aiImage.btn.upload')}</Button>
        </Upload>
        <Button
          type="primary"
          loading={loading}
          onClick={() => run(original, option)}
        >
          {t('aiImage.btn.submit')}
        </Button>
      </Flex>
      {original && (
        <div className={styles.img}>
          <Image
            src={checked ? `${original.split(',')[0]},${processed}` : original}
          />
        </div>
      )}
    </Flex>
  );
}
