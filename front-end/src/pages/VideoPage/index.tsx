import ErrorNotification from '../../components/ErrorNotification';
import type { IErrorNotification } from '../../components/ErrorNotification';
import { useTranslation } from 'react-i18next';
import { useEffect, useRef, useState } from 'react';
import { useRequest } from 'ahooks';
import styles from './index.module.less';
import { Card, Flex } from 'antd';
import dayjs from 'dayjs';
import { getAll } from '../../services/video';
import { LoadingOutlined } from '@ant-design/icons';

const { Meta } = Card;

export default function VideoPage() {
  const { t } = useTranslation();
  const errorRef = useRef<IErrorNotification>(null);
  const bottomRef = useRef<HTMLAnchorElement>(null);
  const pageRef = useRef(1);
  const [videoList, setVideoList] = useState<SubmissionPreviewObj[]>([]);

  const { run: videoRun, loading: videoLoading } = useRequest(getAll, {
    defaultParams: [{ pageNum: 1, pageSize: 30 }],
    onSuccess(data) {
      if (data.success) {
        const list = data.data.dataList!;
        if (list.length === 0) {
          pageRef.current = 0;
          return;
        }
        pageRef.current++;
        setVideoList([...videoList, ...list]);
      } else {
        pageRef.current = 0;
        errorRef.current!.open(data.data.error);
      }
    },
    onError(err) {
      pageRef.current = 0;
      errorRef.current!.open(err);
    },
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !videoLoading && pageRef.current)
          videoRun({ pageNum: pageRef.current, pageSize: 30 });
      },
      {
        root: null,
        rootMargin: '50%',
        threshold: 1,
      }
    );
    const bottom = bottomRef.current;
    if (bottom) observer.observe(bottom);

    return () => {
      if (bottom) observer.unobserve(bottom);
    };
  }, [videoLoading, videoRun]);

  return (
    <Flex vertical gap={16}>
      <ErrorNotification ref={errorRef} />
      {videoLoading && <LoadingOutlined className={styles.loading} />}
      <Flex wrap justify="space-around" gap={16}>
        {videoList.map((ele) => (
          <Card
            key={ele.id}
            hoverable
            className={styles.card}
            cover={<img src={ele.preview} alt="" />}
            onClick={() => window.open('/video/' + ele.id)}
          >
            <Meta
              title={ele.title}
              description={
                <Flex vertical>
                  <div>{ele.uploaderNickname || ele.uploaderAccount}</div>
                  <div>{dayjs(ele.submitTime).format('LLLL')}</div>
                </Flex>
              }
            />
          </Card>
        ))}
      </Flex>
      {!videoLoading && pageRef.current !== 0 && (
        <a
          ref={bottomRef}
          className={styles.loadMore}
          onClick={(e) => {
            e.preventDefault();
            if (pageRef.current)
              videoRun({ pageNum: pageRef.current, pageSize: 30 });
          }}
        >
          {t('video.loadMore')}
        </a>
      )}
    </Flex>
  );
}
