import { useParams } from 'react-router';
import ErrorNotification from '../../components/ErrorNotification';
import type { IErrorNotification } from '../../components/ErrorNotification';
import { useTranslation } from 'react-i18next';
import { useRef, useState } from 'react';
import { useRequest } from 'ahooks';
import { get } from '../../services/video';
import dayjs from 'dayjs';
import styles from './index.module.less';
import {
  Avatar,
  Button,
  Flex,
  Input,
  Pagination,
  Popconfirm,
  Skeleton,
  Space,
} from 'antd';
import {
  collect,
  collectCancel,
  delComment,
  follow,
  followCancel,
  getComment,
  isCollected,
  isFollowed,
  sendComment,
} from '../../services/user';
import { DeleteOutlined, StarFilled, StarOutlined } from '@ant-design/icons';
import { SUBMISSION_TYPE } from '../../types/enums';
import LevelTag from '../../components/LevelTag';

const { TextArea } = Input;

export default function SingleVideo() {
  const id = useParams().id!;
  const { t } = useTranslation();
  const errorRef = useRef<IErrorNotification>(null);
  const [comment, setComment] = useState('');
  const [page, setPage] = useState(1);

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
    run: isCollectedRun,
    data: isCollectedData,
    loading: isCollectedLoading,
  } = useRequest(isCollected, {
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
    run: commentRun,
    data: commentData,
    loading: commentLoading,
  } = useRequest(getComment, {
    defaultParams: [
      {
        id,
        type: SUBMISSION_TYPE.VIDEO,
        pageNum: page,
        pageSize: 30,
      },
    ],
    onError(err) {
      errorRef.current!.open(err);
    },
  });

  const { run: sendCommentRun, loading: sendCommentLoading } = useRequest(
    sendComment,
    {
      manual: true,
      onSuccess(data) {
        if (data.success) {
          setComment('');
          commentRun({
            id,
            type: SUBMISSION_TYPE.VIDEO,
            pageNum: page,
            pageSize: 30,
          });
        } else {
          errorRef.current!.open(data.data.error);
        }
      },
      onError(err) {
        errorRef.current!.open(err);
      },
    }
  );

  const { run: delCommentRun, loading: delCommentLoading } = useRequest(
    delComment,
    {
      manual: true,
      onSuccess(data) {
        if (data.success) {
          commentRun({
            id,
            type: SUBMISSION_TYPE.VIDEO,
            pageNum: page,
            pageSize: 30,
          });
        } else {
          errorRef.current!.open(data.data.error);
        }
      },
      onError(err) {
        errorRef.current!.open(err);
      },
    }
  );

  const { data: videoData } = useRequest(get, {
    defaultParams: [{ id }],
    onSuccess(data) {
      if (data.success) {
        if (data.data.uploader!.canFollow)
          isFollowedRun({ id: data.data.uploader!.uid });
        if (sessionStorage.getItem('token'))
          isCollectedRun({ id, type: SUBMISSION_TYPE.VIDEO });
      } else {
        switch (data.data.error) {
          case 'NO_SUBMISSION':
            return errorRef.current!.open(t('singleVideo.noVideo'));
          default:
            return errorRef.current!.open(data.data.error);
        }
      }
    },
    onError(err) {
      errorRef.current!.open(err);
    },
  });

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

  const { run: collectRun, loading: collectLoading } = useRequest(collect, {
    manual: true,
    onSuccess(data) {
      if (data.success) {
        isCollectedRun({ id, type: SUBMISSION_TYPE.VIDEO });
      } else {
        errorRef.current!.open(data.data.error);
      }
    },
    onError(err) {
      errorRef.current!.open(err);
    },
  });

  const { run: cancelCollectRun, loading: cancelCollectLoading } = useRequest(
    collectCancel,
    {
      manual: true,
      onSuccess(data) {
        if (data.success) {
          isCollectedRun({ id, type: SUBMISSION_TYPE.VIDEO });
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
    <div className={styles.page}>
      <ErrorNotification ref={errorRef} />
      <div className={styles.videoPart}>
        <div className={styles.title}>
          {isCollectedData?.success && videoData?.data.video && (
            <Button
              disabled={
                isCollectedLoading || collectLoading || cancelCollectLoading
              }
              type="text"
              size="small"
              onClick={() => {
                if (isCollectedData?.data.collected) {
                  cancelCollectRun({ id, type: SUBMISSION_TYPE.VIDEO });
                } else {
                  collectRun({ id, type: SUBMISSION_TYPE.VIDEO });
                }
              }}
            >
              {isCollectedData?.data.collected ? (
                <StarFilled className={styles.star} />
              ) : (
                <StarOutlined />
              )}
            </Button>
          )}
          {videoData?.data.title}
        </div>
        <div className={styles.gray}>
          {videoData?.data.submitTime &&
            dayjs(videoData?.data.submitTime).format('lll')}
        </div>
        <video className={styles.video} src={videoData?.data.video} controls />
      </div>
      <Flex className={styles.subPart} vertical gap={16}>
        <div className={styles.uploader}>
          <Avatar
            shape="circle"
            src={videoData?.data.uploader?.avatar}
            size={72}
            className={styles.avatar}
            style={{ cursor: videoData?.data.uploader ? 'pointer' : '' }}
            onClick={() => {
              const uid = videoData?.data.uploader?.uid;
              if (uid) window.open('/submission/' + uid);
            }}
          >
            {(
              videoData?.data.uploader?.nickname ||
              videoData?.data.uploader?.account
            )?.substring(0, 2)}
          </Avatar>
          <Flex vertical>
            <Flex>
              <div className={styles.account}>
                {videoData?.data.uploader?.nickname ||
                  videoData?.data.uploader?.account ||
                  '-'}
              </div>
            </Flex>
            <div className={styles.accountName}>
              @{videoData?.data.uploader?.account}
            </div>
            {videoData?.data.uploader?.canFollow && (
              <Button
                loading={
                  isFollowedLoading || followLoading || cancelFollowLoading
                }
                type={isFollowedData?.data.followed ? 'default' : 'primary'}
                onClick={() => {
                  if (isFollowedData?.data.followed) {
                    cancelFollowRun({ id: videoData.data.uploader!.uid });
                  } else {
                    followRun({ id: videoData.data.uploader!.uid });
                  }
                }}
              >
                {isFollowedData?.data.followed
                  ? t('singleVideo.cancelSubscribe')
                  : t('singleVideo.subscribe')}
              </Button>
            )}
          </Flex>
        </div>
        <Flex className={styles.commentPart} vertical gap={8}>
          <div className={styles.title}>{t('singleVideo.comment')}</div>
          {isCollectedData?.success && (
            <Space.Compact>
              <TextArea
                className={styles.textarea}
                showCount
                maxLength={200}
                value={comment}
                autoSize={{ maxRows: 4 }}
                onChange={(e) =>
                  setComment(e.target.value.replace(/[\r\n]/g, ''))
                }
                placeholder={t('singleVideo.placeholder')}
              />
              <Button
                type="primary"
                loading={sendCommentLoading}
                onClick={() =>
                  sendCommentRun({
                    id,
                    type: SUBMISSION_TYPE.VIDEO,
                    content: comment,
                  })
                }
              >
                {t('singleVideo.send')}
              </Button>
            </Space.Compact>
          )}
          <Skeleton avatar active loading={commentLoading}>
            {commentData?.data.dataList?.length === 0 && (
              <div className={styles.noComment}>
                {t('singleVideo.noComment')}
              </div>
            )}
            {commentData?.data.dataList?.length !== 0 && (
              <>
                {commentData?.data.dataList?.map((ele) => (
                  <Flex
                    key={ele.id}
                    vertical
                    gap={4}
                    className={styles.commentCard}
                  >
                    <Flex gap={8} className={styles.account}>
                      <Avatar
                        shape="circle"
                        src={ele.sender.avatar}
                        size={32}
                        className={styles.avatar}
                        onClick={() =>
                          window.open('/submission/' + ele.sender.uid)
                        }
                      >
                        {(ele.sender.nickname || ele.sender.account).substring(
                          0,
                          2
                        )}
                      </Avatar>
                      <div className={styles.senderName}>
                        <LevelTag exp={ele.sender.exp} />
                        {ele.sender.nickname || ele.sender.account}
                      </div>
                      <div className={styles.gray}>
                        {dayjs(ele.time).format('l LTS')}
                      </div>
                      {ele.canDelete && (
                        <Popconfirm
                          title={t('singleVideo.delConfirm')}
                          onConfirm={() => delCommentRun({ id: ele.id })}
                        >
                          <Button
                            size="small"
                            type="text"
                            disabled={delCommentLoading}
                          >
                            <DeleteOutlined />
                          </Button>
                        </Popconfirm>
                      )}
                    </Flex>
                    {ele.content}
                  </Flex>
                ))}
                <Pagination
                  size="small"
                  align="center"
                  pageSize={30}
                  current={page}
                  onChange={(pageNum, pageSize) => {
                    setPage(pageNum);
                    commentRun({
                      id,
                      type: SUBMISSION_TYPE.VIDEO,
                      pageNum,
                      pageSize,
                    });
                  }}
                />
              </>
            )}
          </Skeleton>
        </Flex>
      </Flex>
    </div>
  );
}
