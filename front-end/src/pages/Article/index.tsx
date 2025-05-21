import ErrorNotification from '../../components/ErrorNotification';
import type { IErrorNotification } from '../../components/ErrorNotification';
import { useTranslation } from 'react-i18next';
import { useEffect, useRef, useState } from 'react';
import { useRequest } from 'ahooks';
import styles from './index.module.less';
import { Card, Flex } from 'antd';
import dayjs from 'dayjs';
import { getAll } from '../../services/article';
import { LoadingOutlined } from '@ant-design/icons';

const { Meta } = Card;

export default function Article() {
  const { t } = useTranslation();
  const errorRef = useRef<IErrorNotification>(null);
  const bottomRef = useRef<HTMLAnchorElement>(null);
  const pageRef = useRef(1);
  const [articleList, setArticleList] = useState<SubmissionPreviewObj[]>([]);

  const { run: articleRun, loading: articleLoading } = useRequest(getAll, {
    defaultParams: [{ pageNum: 1, pageSize: 30 }],
    onSuccess(data) {
      if (data.success) {
        const list = data.data.dataList!;
        if (list.length === 0) {
          pageRef.current = 0;
          return;
        }
        pageRef.current++;
        setArticleList([...articleList, ...list]);
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
        if (entry.isIntersecting && !articleLoading && pageRef.current)
          articleRun({ pageNum: pageRef.current, pageSize: 30 });
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
  }, [articleLoading, articleRun]);

  return (
    <Flex vertical gap={16}>
      <ErrorNotification ref={errorRef} />
      {articleLoading && <LoadingOutlined className={styles.loading} />}
      <Flex wrap justify="space-around" gap={16}>
        {articleList.map((ele) => (
          <Card
            key={ele.id}
            hoverable
            className={styles.card}
            onClick={() => window.open('/article/' + ele.id)}
          >
            <Meta
              title={ele.title}
              description={
                <Flex vertical>
                  <div>{ele.uploaderNickname || ele.uploaderAccount}</div>
                  <div>{dayjs(ele.submitTime).format('LLLL')}</div>
                  <div className={styles.preview}>
                    {ele.preview.length > 50
                      ? ele.preview.substring(0, 50) + '...'
                      : ele.preview}
                  </div>
                </Flex>
              }
            />
          </Card>
        ))}
      </Flex>
      {!articleLoading && pageRef.current !== 0 && (
        <a
          ref={bottomRef}
          className={styles.loadMore}
          onClick={(e) => {
            e.preventDefault();
            if (pageRef.current)
              articleRun({ pageNum: pageRef.current, pageSize: 30 });
          }}
        >
          {t('article.loadMore')}
        </a>
      )}
    </Flex>
  );
}
