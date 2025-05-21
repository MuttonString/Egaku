import { Avatar, Flex } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import styles from './index.module.less';
import classnames from '../../utils/classnames';
import { useRequest } from 'ahooks';
import { getFollowed, getFollowedSubmission } from '../../services/user';
import type { IErrorNotification } from '../../components/ErrorNotification';
import ErrorNotification from '../../components/ErrorNotification';
import { LoadingOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

export default function Subscription() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const errorRef = useRef<IErrorNotification>(null);
  const bottomRef = useRef<HTMLAnchorElement>(null);
  const pageRef = useRef(1);
  const [submissionList, setSubmissionList] = useState<SubmissionPreviewObj[]>(
    []
  );

  const { run: submissionRun, loading: submissionLoading } = useRequest(
    getFollowedSubmission,
    {
      manual: true,
      onSuccess(data) {
        if (data.success) {
          const list = data.data.dataList!;
          if (list.length === 0) {
            pageRef.current = 0;
            return;
          }
          pageRef.current++;
          setSubmissionList([...submissionList, ...list]);
        } else {
          pageRef.current = 0;
          errorRef.current!.open(data.data.error);
        }
      },
      onError(err) {
        pageRef.current = 0;
        errorRef.current!.open(err);
      },
    }
  );

  const { run: userRun, data: userData } = useRequest(getFollowed, {
    manual: true,
    onSuccess(data) {
      if (!data.success) {
        errorRef.current!.open(data.data.error);
      }
    },
    onError(err) {
      errorRef.current!.open(err);
    },
  });

  useEffect(() => {
    if (!sessionStorage.getItem('token')) {
      navigate('/', { replace: true });
      return;
    }
    userRun({ pageNum: 1, pageSize: Number.MAX_SAFE_INTEGER });
  }, [navigate, userRun]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !submissionLoading && pageRef.current)
          submissionRun({ pageNum: pageRef.current, pageSize: 30 });
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
  }, [submissionLoading, submissionRun]);

  return (
    <Flex className={styles.page} gap={16}>
      <ErrorNotification ref={errorRef} />
      <Flex
        vertical
        gap={16}
        align="center"
        className={classnames(styles.part, styles.left)}
      >
        <div className={styles.title}>{t('subscription.title')}</div>
        {userData?.data.dataList?.map((ele) => (
          <Flex vertical align="center" gap={4}>
            <Avatar
              key={ele.uid}
              shape="circle"
              src={ele.avatar}
              size={72}
              className={styles.avatar}
              onClick={() => {
                const uid = ele.uid;
                if (uid) window.open('/submission/' + uid);
              }}
            >
              {(ele.nickname || ele.account)!.substring(0, 2)}
            </Avatar>
            <div>{ele.nickname || ele.account}</div>
          </Flex>
        ))}
      </Flex>
      <div className={classnames(styles.part, styles.right)}>
        {submissionLoading && <LoadingOutlined className={styles.loading} />}
        {submissionList.map((ele) => {
          return (
            <Flex
              key={`${ele.type}_${ele.id}`}
              className={styles.card}
              onClick={() => {
                if (ele.type === 0) {
                  window.open('/article/' + ele.id);
                } else {
                  window.open('/video/' + ele.id);
                }
              }}
            >
              {ele.type === 1 && <img src={ele.preview} alt="" />}
              <Flex vertical justify="space-between" className={styles.inner}>
                <div className={styles.title}>{ele.title}</div>
                {ele.type === 0 && (
                  <div>
                    {ele.preview.length > 50
                      ? ele.preview.substring(0, 50) + '...'
                      : ele.preview}
                  </div>
                )}
                <div className={styles.gray}>
                  {ele.uploaderNickname || ele.uploaderAccount}
                </div>
                <div className={styles.gray}>
                  {dayjs(ele.submitTime).format('LLLL')}
                </div>
              </Flex>
            </Flex>
          );
        })}
        {!submissionLoading && pageRef.current !== 0 && (
          <a
            ref={bottomRef}
            className={styles.loadMore}
            onClick={(e) => {
              e.preventDefault();
              if (pageRef.current)
                submissionRun({ pageNum: pageRef.current, pageSize: 30 });
            }}
          >
            {t('subscription.loadMore')}
          </a>
        )}
      </div>
    </Flex>
  );
}
