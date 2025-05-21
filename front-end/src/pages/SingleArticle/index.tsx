import { useParams } from 'react-router';
import ErrorNotification from '../../components/ErrorNotification';
import type { IErrorNotification } from '../../components/ErrorNotification';
import { useTranslation } from 'react-i18next';
import { useCallback, useRef, useState } from 'react';
import { useRequest } from 'ahooks';
import { get, summary } from '../../services/article';
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
  Image,
  Popover,
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
import {
  DeleteOutlined,
  RobotOutlined,
  StarFilled,
  StarOutlined,
} from '@ant-design/icons';
import { SUBMISSION_TYPE } from '../../types/enums';
import LevelTag from '../../components/LevelTag';
import { convertFromRaw, Editor, EditorState } from 'draft-js';
import type { ContentBlock, RawDraftContentState } from 'draft-js';

const { TextArea } = Input;
const customStyleMap = {
  HIGHLIGHT: {
    backgroundColor: '#ffff007f',
  },
  RED: {
    color: 'red',
  },
  BLUE: {
    color: 'royalblue',
  },
  '1.5X': {
    fontSize: '1.5em',
  },
  '2X': {
    fontSize: '2em',
  },
  '3X': {
    fontSize: '3em',
  },
};

type BlockProps = { blockProps: { src: string } };
const imageRender = ({ blockProps }: BlockProps) => (
  <Image src={blockProps.src} style={{ maxHeight: '20em' }} />
);

export default function SingleArticle() {
  const id = useParams().id!;
  const { t } = useTranslation();
  const errorRef = useRef<IErrorNotification>(null);
  const [comment, setComment] = useState('');
  const [page, setPage] = useState(1);
  const [editorState, setEditorState] = useState(EditorState.createEmpty());
  const [summaryText, setSummaryText] = useState(
    sessionStorage.getItem(`${SUBMISSION_TYPE.ARTICLE}_${id}`)
  );
  const [popupOpen, setPopupOpen] = useState(false);

  const { run: summaryRun, loading: summaryLoading } = useRequest(summary, {
    manual: true,
    onSuccess(data) {
      if (data.success) {
        setSummaryText(data.data.summary!);
        sessionStorage.setItem(
          `${SUBMISSION_TYPE.ARTICLE}_${id}`,
          data.data.summary!
        );
        setPopupOpen(true);
      } else {
        errorRef.current!.open(data.data.error);
      }
    },
    onError(err) {
      errorRef.current!.open(err);
    },
  });

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
        type: SUBMISSION_TYPE.ARTICLE,
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
            type: SUBMISSION_TYPE.ARTICLE,
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
            type: SUBMISSION_TYPE.ARTICLE,
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

  const { data: articleData } = useRequest(get, {
    defaultParams: [{ id }],
    onSuccess(data) {
      if (data.success) {
        setEditorState(
          EditorState.createWithContent(
            convertFromRaw(
              JSON.parse(data.data.content!) as RawDraftContentState
            )
          )
        );
        if (data.data.uploader!.canFollow)
          isFollowedRun({ id: data.data.uploader!.uid });
        if (sessionStorage.getItem('token'))
          isCollectedRun({ id, type: SUBMISSION_TYPE.ARTICLE });
      } else {
        switch (data.data.error) {
          case 'NO_SUBMISSION':
            return errorRef.current!.open(t('singleArticle.noArticle'));
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
        isCollectedRun({ id, type: SUBMISSION_TYPE.ARTICLE });
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
          isCollectedRun({ id, type: SUBMISSION_TYPE.ARTICLE });
        } else {
          errorRef.current!.open(data.data.error);
        }
      },
      onError(err) {
        errorRef.current!.open(err);
      },
    }
  );

  const blockRendererFn = useCallback(
    (contentBlock: ContentBlock) => {
      if (contentBlock.getType() === 'atomic') {
        const contentState = editorState.getCurrentContent();
        const entityKey = contentBlock.getEntityAt(0);

        if (entityKey) {
          const entity = contentState.getEntity(entityKey);
          const type = entity.getType();

          if (type === 'IMAGE') {
            return {
              component: imageRender,
              editable: false,
              props: { src: entity.getData().src },
            };
          }
        }
      }
      return null;
    },
    [editorState]
  );

  return (
    <div className={styles.page}>
      <ErrorNotification ref={errorRef} />
      <div className={styles.articlePart}>
        <div className={styles.title}>
          {isCollectedData?.success && articleData?.data.content && (
            <Button
              disabled={
                isCollectedLoading || collectLoading || cancelCollectLoading
              }
              type="text"
              size="small"
              onClick={() => {
                if (isCollectedData?.data.collected) {
                  cancelCollectRun({ id, type: SUBMISSION_TYPE.ARTICLE });
                } else {
                  collectRun({ id, type: SUBMISSION_TYPE.ARTICLE });
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
          {articleData?.data.title}
          {articleData?.data.title && (
            <Popover
              content={summaryText}
              trigger="click"
              placement="bottomRight"
              open={popupOpen}
              onOpenChange={setPopupOpen}
            >
              <Button
                onClick={() => {
                  if (!summaryText)
                    summaryRun({
                      title: articleData.data.title!,
                      content: editorState.getCurrentContent().getPlainText(),
                    });
                }}
                loading={summaryLoading}
                className={styles.summary}
              >
                <RobotOutlined />
                {t('singleArticle.summary')}
              </Button>
            </Popover>
          )}
        </div>
        <div className={styles.gray}>
          {articleData?.data.submitTime &&
            dayjs(articleData?.data.submitTime).format('lll')}
        </div>
        <div className={styles.article}>
          <Editor
            editorState={editorState}
            onChange={() => {}}
            customStyleMap={customStyleMap}
            blockRendererFn={blockRendererFn}
            readOnly
          />
        </div>
      </div>
      <Flex className={styles.subPart} vertical gap={16}>
        <div className={styles.uploader}>
          <Avatar
            shape="circle"
            src={articleData?.data.uploader?.avatar}
            size={72}
            className={styles.avatar}
            style={{ cursor: articleData?.data.uploader ? 'pointer' : '' }}
            onClick={() => {
              const uid = articleData?.data.uploader?.uid;
              if (uid) window.open('/submission/' + uid);
            }}
          >
            {(
              articleData?.data.uploader?.nickname ||
              articleData?.data.uploader?.account
            )?.substring(0, 2)}
          </Avatar>
          <Flex vertical>
            <Flex>
              <div className={styles.account}>
                {articleData?.data.uploader?.nickname ||
                  articleData?.data.uploader?.account ||
                  '-'}
              </div>
            </Flex>
            <div className={styles.accountName}>
              @{articleData?.data.uploader?.account}
            </div>
            {articleData?.data.uploader?.canFollow && (
              <Button
                loading={
                  isFollowedLoading || followLoading || cancelFollowLoading
                }
                type={isFollowedData?.data.followed ? 'default' : 'primary'}
                onClick={() => {
                  if (isFollowedData?.data.followed) {
                    cancelFollowRun({ id: articleData.data.uploader!.uid });
                  } else {
                    followRun({ id: articleData.data.uploader!.uid });
                  }
                }}
              >
                {isFollowedData?.data.followed
                  ? t('singleArticle.cancelSubscribe')
                  : t('singleArticle.subscribe')}
              </Button>
            )}
          </Flex>
        </div>
        <Flex className={styles.commentPart} vertical gap={8}>
          <div className={styles.title}>{t('singleArticle.comment')}</div>
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
                placeholder={t('singleArticle.placeholder')}
              />
              <Button
                type="primary"
                loading={sendCommentLoading}
                onClick={() =>
                  sendCommentRun({
                    id,
                    type: SUBMISSION_TYPE.ARTICLE,
                    content: comment,
                  })
                }
              >
                {t('singleArticle.send')}
              </Button>
            </Space.Compact>
          )}
          <Skeleton avatar active loading={commentLoading}>
            {commentData?.data.dataList?.length === 0 && (
              <div className={styles.noComment}>
                {t('singleArticle.noComment')}
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
                          title={t('singleArticle.delConfirm')}
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
                      type: SUBMISSION_TYPE.ARTICLE,
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
