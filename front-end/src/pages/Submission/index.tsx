import { useParams } from 'react-router';
import ErrorNotification from '../../components/ErrorNotification';
import type { IErrorNotification } from '../../components/ErrorNotification';
import { useTranslation } from 'react-i18next';
import { useEffect, useRef, useState } from 'react';
import { useRequest } from 'ahooks';
import {
  follow,
  followCancel,
  getDetailInfo,
  getSubmissionPreview,
  isFollowed,
} from '../../services/user';
import styles from './index.module.less';
import { Avatar, Button, Card, Flex, Skeleton } from 'antd';
import LevelTag from '../../components/LevelTag';
import {
  LoadingOutlined,
  ManOutlined,
  PlaySquareOutlined,
  ReadOutlined,
  WomanOutlined,
} from '@ant-design/icons';
import { USER_SEX } from '../../types/enums';
import dayjs from 'dayjs';

const { Meta } = Card;

export default function Submission() {
  const { uid } = useParams();
  const { t } = useTranslation();
  const errorRef = useRef<IErrorNotification>(null);
  const bottomRef = useRef<HTMLAnchorElement>(null);
  const pageRef = useRef(1);
  const [submissionList, setSubmissionList] = useState<SubmissionPreviewObj[]>(
    []
  );

  const { run: submissionRun, loading: submissionLoading } = useRequest(
    getSubmissionPreview,
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

  const {
    run: isFollowedRun,
    data: isFollowedData,
    loading: isFollowedLoading,
  } = useRequest(isFollowed, {
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

  const {
    data: userData,
    run: userRun,
    loading: userLoading,
  } = useRequest(getDetailInfo, {
    manual: true,
    onSuccess(data) {
      if (data.success) {
        if (uid) isFollowedRun({ id: uid });
      } else {
        switch (data.data.error) {
          case 'NO_USER':
            return errorRef.current!.open(t('submission.noUser'));
          default:
            return errorRef.current!.open(data.data.error);
        }
      }
    },
    onError(err) {
      errorRef.current!.open(err);
    },
  });

  useEffect(() => {
    userRun({ uid });
    pageRef.current = 1;
    setSubmissionList([]);
  }, [uid, userRun]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !submissionLoading && pageRef.current)
          submissionRun({ uid, pageNum: pageRef.current, pageSize: 30 });
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
  }, [submissionLoading, submissionRun, uid]);

  const { run: followRun, loading: followLoading } = useRequest(follow, {
    manual: true,
    onSuccess(data, [{ id }]) {
      if (data.success) {
        isFollowedRun({ id });
      } else {
        errorRef.current!.open(data.data.error);
      }
    },
    onError(err) {
      errorRef.current!.open(err);
    },
  });

  const { run: cancelFollowRun, loading: cancelFollowLoading } = useRequest(
    followCancel,
    {
      manual: true,
      onSuccess(data, [{ id }]) {
        if (data.success) {
          isFollowedRun({ id });
        } else {
          errorRef.current!.open(data.data.error);
        }
      },
      onError(err) {
        errorRef.current!.open(err);
      },
    }
  );

  return (
    <Flex vertical gap={16}>
      <ErrorNotification ref={errorRef} />
      {submissionLoading && <LoadingOutlined className={styles.loading} />}
      <Flex gap={16} vertical className={styles.upperPart}>
        <Skeleton loading={userLoading}>
          <Flex gap={8} align="center" className={styles.account}>
            <Avatar
              shape="circle"
              src={userData?.data.avatar}
              size={72}
              className={styles.avatar}
            >
              {(userData?.data.nickname || userData?.data.account)?.substring(
                0,
                2
              )}
            </Avatar>
            <Flex vertical gap={4}>
              <Flex className={styles.nickname} align="center">
                <LevelTag exp={userData?.data.exp} />
                {userData?.data.nickname || userData?.data.account || '-'}
              </Flex>
              <div className={styles.accountName}>
                @{userData?.data.account}
              </div>
              <Flex gap={8} align="center">
                {userData?.data.sex == USER_SEX.MALE && (
                  <ManOutlined className={styles.man} />
                )}
                {userData?.data.sex == USER_SEX.FEMALE && (
                  <WomanOutlined className={styles.woman} />
                )}
                {userData?.data.signupTime && (
                  <div className={styles.signupTime}>
                    {t('submission.signupDate')}
                    {dayjs(userData.data.signupTime).format('ll')}
                  </div>
                )}
              </Flex>
            </Flex>
            <Flex className={styles.cntPart} gap={16} flex={1} align="center">
              <Flex vertical gap={8} align="center">
                <div className={styles.cntTitle}>
                  {t('submission.subscriber')}
                </div>
                <div className={styles.cnt}>{userData?.data.followerTotal}</div>
              </Flex>
              <Flex vertical gap={8} align="center">
                <div className={styles.cntTitle}>{t('submission.video')}</div>
                <div className={styles.cnt}>{userData?.data.videoTotal}</div>
              </Flex>
              <Flex vertical gap={8} align="center">
                <div className={styles.cntTitle}>{t('submission.article')}</div>
                <div className={styles.cnt}>{userData?.data.articleTotal}</div>
              </Flex>
            </Flex>
            {userData?.data.canFollow && (
              <Button
                loading={
                  isFollowedLoading || followLoading || cancelFollowLoading
                }
                type={isFollowedData?.data.followed ? 'default' : 'primary'}
                onClick={() => {
                  if (isFollowedData?.data.followed) {
                    cancelFollowRun({ id: uid! });
                  } else {
                    followRun({ id: uid! });
                  }
                }}
              >
                {isFollowedData?.data.followed
                  ? t('submission.cancelSubscribe')
                  : t('submission.subscribe')}
              </Button>
            )}
          </Flex>
          {userData?.data.desc}
        </Skeleton>
      </Flex>
      <Flex wrap justify="space-around" gap={16}>
        {submissionList.map((ele) => {
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
                    {ele.title}
                  </Flex>
                }
                description={dayjs(ele.submitTime).format('LLLL')}
              />
            </Card>
          );
        })}
      </Flex>
      {!userLoading && !submissionLoading && pageRef.current !== 0 && (
        <a
          ref={bottomRef}
          className={styles.loadMore}
          onClick={(e) => {
            e.preventDefault();
            if (pageRef.current)
              submissionRun({ uid, pageNum: pageRef.current, pageSize: 30 });
          }}
        >
          {t('submission.loadMore')}
        </a>
      )}
    </Flex>
  );
}
