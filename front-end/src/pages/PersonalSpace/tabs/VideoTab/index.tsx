import { Button, Flex, Input, Space, Spin, Upload } from 'antd';
import styles from './index.module.less';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ImgCrop from 'antd-img-crop';
import { imgResize } from '../../../../utils/imgResize';
import { LoadingOutlined, UploadOutlined } from '@ant-design/icons';
import { useRequest } from 'ahooks';
import { uploadFile } from '../../../../services/common';
import ErrorNotification from '../../../../components/ErrorNotification';
import type { IErrorNotification } from '../../../../components/ErrorNotification';
import { submit } from '../../../../services/video';
import SuccessMessage from '../../../../components/SuccessMessage';
import type { ISuccessMessage } from '../../../../components/SuccessMessage';

export default function VideoTab() {
  const { t } = useTranslation();
  const errorRef = useRef<IErrorNotification>(null);
  const successRef = useRef<ISuccessMessage>(null);
  const [title, setTitle] = useState('');
  const [processing, setProcessing] = useState(false);
  const [cover, setCover] = useState('');
  const [video, setVideo] = useState('');
  const [errorShow, setErrorShow] = useState(false);

  const { loading: coverLoading, run: coverRun } = useRequest(uploadFile, {
    manual: true,
    onSuccess(res) {
      if (res.success) {
        setCover(res.data.url || '');
      } else {
        errorRef.current!.open(res.data.error);
      }
    },
    onError(err) {
      errorRef.current!.open(err);
    },
  });

  const { loading: videoLoading, run: videoRun } = useRequest(uploadFile, {
    manual: true,
    onSuccess(res) {
      if (res.success) {
        setVideo(res.data.url || '');
      } else {
        errorRef.current!.open(res.data.error);
      }
    },
    onError(err) {
      errorRef.current!.open(err);
    },
  });

  const { run: submitRun, loading: submitLoading } = useRequest(submit, {
    manual: true,
    onSuccess(data) {
      if (data.success) {
        setTitle('');
        setCover('');
        setVideo('');
        successRef.current!.open(t('personal.video.submit'));
      } else {
        errorRef.current!.open(data.data.error);
      }
    },
    onError(err) {
      errorRef.current!.open(err);
    },
  });

  return (
    <Flex vertical gap={16} className={styles.container}>
      <ErrorNotification ref={errorRef} />
      <SuccessMessage ref={successRef} />
      <Space.Compact>
        <Input
          maxLength={50}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('personal.video.title')}
          showCount
        />
        <Button
          type="primary"
          disabled={!title.trim() || !cover || !video}
          loading={submitLoading}
          onClick={() => {
            submitRun({
              title,
              cover,
              video,
            });
          }}
        >
          {t('personal.video.submit')}
        </Button>
      </Space.Compact>
      <ImgCrop
        showReset
        resetText={t('personal.video.reset')}
        aspect={4 / 3}
        modalTitle={t('personal.video.crop')}
        beforeCrop={(file) => file.type.startsWith('image')}
      >
        <Upload
          accept="image/*"
          showUploadList={false}
          beforeUpload={async (file) => {
            if (!file.type.startsWith('image')) return false;
            setProcessing(true);
            const newFile = await imgResize(file, 1024);
            coverRun(newFile);
            setProcessing(false);
            return false;
          }}
          className={styles.cover}
        >
          {coverLoading || processing ? (
            <LoadingOutlined />
          ) : cover ? (
            <img src={cover} width={256} height={192} alt="" />
          ) : (
            <>
              <UploadOutlined />
              <div>{t('personal.video.uploadCover')}</div>
            </>
          )}
        </Upload>
      </ImgCrop>
      <Flex vertical>
        <Flex gap={16}>
          <Upload
            accept="video/mp4, video/webm, video/ogg"
            showUploadList={false}
            beforeUpload={(file) => {
              if (!['video/mp4', 'video/webm', 'video/ogg'].includes(file.type))
                return false;
              if (file.size > 1024 * 1024 * 1024) {
                setErrorShow(true);
                return false;
              }
              setErrorShow(false);
              videoRun(file);
              return false;
            }}
          >
            <Button disabled={videoLoading}>
              {t('personal.video.uploadVideo')}
            </Button>
          </Upload>
          {!videoLoading && (
            <div
              className={styles.error}
              style={{ color: errorShow ? 'red' : '' }}
            >
              {t('personal.video.limit')}
            </div>
          )}
          <Spin spinning={videoLoading} percent="auto" size="large" />
        </Flex>
        {video && (
          <video
            src={video}
            controls
            controlsList="nodownload noremoteplayback"
            className={styles.video}
          />
        )}
      </Flex>
    </Flex>
  );
}
