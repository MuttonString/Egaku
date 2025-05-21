import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import type { IErrorNotification } from '../../components/ErrorNotification';
import { useRequest } from 'ahooks';
import { search } from '../../services/common';
import styles from './index.module.less';
import ErrorNotification from '../../components/ErrorNotification';
import { Card, Flex } from 'antd';
import {
  LoadingOutlined,
  PlaySquareOutlined,
  ReadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';

const { Meta } = Card;

export default function SearchResult() {
  const [query] = useSearchParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const q = query.get('search');
  const errorRef = useRef<IErrorNotification>(null);
  const bottomRef = useRef<HTMLAnchorElement>(null);
  const pageRef = useRef(1);
  const [searchList, setSearchList] = useState<SubmissionPreviewObj[]>([]);

  const { run: searchRun, loading: searchLoading } = useRequest(search, {
    manual: true,
    onSuccess(data) {
      if (data.success) {
        const list = data.data.dataList!;
        if (list.length === 0) {
          pageRef.current = 0;
          return;
        }
        pageRef.current++;
        setSearchList([...searchList, ...list]);
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
        if (entry.isIntersecting && !searchLoading && pageRef.current)
          searchRun({
            content: q!,
            pageNum: pageRef.current,
            pageSize: 30,
          });
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
  }, [q, searchLoading, searchRun]);

  useEffect(() => {
    if (!q) {
      navigate('/', { replace: true });
      return;
    }
    pageRef.current = 1;
    searchRun({
      content: q!,
      pageNum: 1,
      pageSize: 30,
    });
  }, [navigate, q, searchRun]);

  return (
    <Flex vertical gap={16}>
      <ErrorNotification ref={errorRef} />
      {searchLoading && <LoadingOutlined className={styles.loading} />}
      <div className={styles.title}>{t('search.title', { content: q })}</div>
      <Flex wrap justify="space-around" gap={16}>
        {searchList.map((ele) => {
          let cover;
          if (ele.type === 0) {
            cover = ele.preview;
            if (cover.length > 50) cover = cover.substring(0, 50) + '...';
            cover = <div className={styles.preview}>{cover}</div>;
          } else {
            cover = <img src={ele.preview} alt="" />;
          }
          return (
            <Card
              key={`${ele.type}_${ele.id}`}
              hoverable
              className={styles.card}
              cover={cover}
              onClick={() => {
                if (ele.type === 0) {
                  window.open('/article/' + ele.id);
                } else {
                  window.open('/video/' + ele.id);
                }
              }}
            >
              <Meta
                title={
                  <Flex gap={8} align="center">
                    {ele.type === 0 ? <ReadOutlined /> : <PlaySquareOutlined />}
                    <div className={styles.title}>{ele.title}</div>
                  </Flex>
                }
                description={
                  <Flex vertical>
                    <div>{ele.uploaderNickname || ele.uploaderAccount}</div>
                    <div>{dayjs(ele.submitTime).format('LLLL')}</div>
                  </Flex>
                }
              />
            </Card>
          );
        })}
      </Flex>
      {!searchLoading && pageRef.current !== 0 && (
        <a
          ref={bottomRef}
          className={styles.loadMore}
          onClick={(e) => {
            e.preventDefault();
            if (pageRef.current)
              searchRun({
                content: q!,
                pageNum: pageRef.current,
                pageSize: 30,
              });
          }}
        >
          {t('search.loadMore')}
        </a>
      )}
    </Flex>
  );
}
