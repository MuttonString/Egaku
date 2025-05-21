import { Button, Flex, Image, Modal, Popconfirm, Table } from 'antd';
import type { TableProps } from 'antd';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './index.module.less';
import { useRequest } from 'ahooks';
import {
  delSubmission,
  getSubmission,
  updSubmission,
} from '../../../../services/user';
import ErrorNotification from '../../../../components/ErrorNotification';
import type { IErrorNotification } from '../../../../components/ErrorNotification';
import SuccessMessage from '../../../../components/SuccessMessage';
import type { ISuccessMessage } from '../../../../components/SuccessMessage';
import { LoadingOutlined } from '@ant-design/icons';
import { convertFromRaw } from 'draft-js';
import type { RawDraftContentState } from 'draft-js';
import dayjs from 'dayjs';
import { SUBMISSION_STATUS, SUBMISSION_TYPE } from '../../../../types/enums';

export default function SubmissionTab() {
  const { t } = useTranslation();
  const errorRef = useRef<IErrorNotification>(null);
  const successRef = useRef<ISuccessMessage>(null);
  const [dataSource, setDataSource] = useState<SubmissionObj[]>();
  const [pageNum, setPageNum] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [articleTitle, setArticleTitle] = useState('');
  const [articleContent, setArticleContent] = useState('');
  const [open, setOpen] = useState(false);

  const statusText = useMemo(
    () => ({
      [SUBMISSION_STATUS.TO_BE_REVIEWED]: t('personal.submission.reviewing'),
      [SUBMISSION_STATUS.PASS]: t('personal.submission.passed'),
      [SUBMISSION_STATUS.NOT_PASS]: t('personal.submission.notPass'),
      [SUBMISSION_STATUS.RE_REVIEW]: t('personal.submission.reviewing'),
      [SUBMISSION_STATUS.BANNED]: t('personal.submission.banned'),
    }),
    [t]
  );

  const { data, run, loading } = useRequest(getSubmission, {
    defaultParams: [{ pageNum, pageSize }],
    onSuccess(data) {
      if (data.success) {
        setDataSource(data.data.dataList);
      } else {
        errorRef.current!.open(data.data.error);
      }
    },
    onError(err) {
      errorRef.current!.open(err);
    },
  });

  const { run: delRun, loading: delLoading } = useRequest(delSubmission, {
    manual: true,
    onSuccess(data) {
      if (data.success) {
        successRef.current!.open(t('personal.submission.del'));
        run({ pageNum, pageSize });
      } else {
        errorRef.current!.open(data.data.error);
      }
    },
    onError(err) {
      errorRef.current!.open(err);
    },
  });

  const { run: updRun, loading: updLoading } = useRequest(updSubmission, {
    manual: true,
    onSuccess(data) {
      if (data.success) {
        successRef.current!.open(t('personal.submission.reReview'));
        run({ pageNum, pageSize });
      } else {
        errorRef.current!.open(data.data.error);
      }
    },
    onError(err) {
      errorRef.current!.open(err);
    },
  });

  const columns: TableProps<SubmissionObj>['columns'] = useMemo(
    () => [
      {
        title: t('personal.submission.title'),
        key: 'title',
        dataIndex: 'title',
      },
      {
        title: t('personal.submission.content'),
        key: 'content',
        render(_, { title, content, preview, cover, video }) {
          if (video) {
            return (
              <Image
                src={cover}
                preview={{
                  destroyOnHidden: true,
                  imageRender: () => (
                    <video className={styles.video} controls src={video} />
                  ),
                  toolbarRender: () => null,
                }}
              />
            );
          } else {
            const text = convertFromRaw(
              JSON.parse(content!) as RawDraftContentState
            ).getPlainText();

            return (
              <a
                onClick={(e) => {
                  e.preventDefault();
                  setArticleTitle(title);
                  setArticleContent(text);
                  setOpen(true);
                }}
              >
                {preview!.length > 50
                  ? preview!.substring(0, 50) + '...'
                  : preview}
              </a>
            );
          }
        },
      },
      {
        title: t('personal.submission.time'),
        key: 'time',
        dataIndex: 'submitTime',
        render(data) {
          return dayjs(data).format('lll');
        },
      },
      {
        title: t('personal.submission.status'),
        key: 'status',
        dataIndex: 'status',
        render(data: SUBMISSION_STATUS, { desc }) {
          return desc ? (
            <>
              {statusText[data]}
              <br />({desc})
            </>
          ) : (
            statusText[data]
          );
        },
      },
      {
        key: 'operation',
        render(_, { id, video, status }) {
          return (
            <Flex gap={16}>
              <Popconfirm
                title={t('personal.submission.del')}
                description={t('personal.submission.delWarn')}
                onConfirm={() =>
                  delRun({
                    id,
                    type: video
                      ? SUBMISSION_TYPE.VIDEO
                      : SUBMISSION_TYPE.ARTICLE,
                  })
                }
              >
                <Button danger>{t('personal.submission.del')}</Button>
              </Popconfirm>
              {status === SUBMISSION_STATUS.NOT_PASS && (
                <Button
                  onClick={() =>
                    updRun({
                      id,
                      type: video
                        ? SUBMISSION_TYPE.VIDEO
                        : SUBMISSION_TYPE.ARTICLE,
                      status: SUBMISSION_STATUS.RE_REVIEW,
                    })
                  }
                >
                  {t('personal.submission.reReview')}
                </Button>
              )}
            </Flex>
          );
        },
      },
    ],
    [delRun, statusText, t, updRun]
  );

  return (
    <>
      <Modal
        title={articleTitle}
        footer={null}
        open={open}
        onCancel={() => setOpen(false)}
      >
        {articleContent}
      </Modal>
      <ErrorNotification ref={errorRef} />
      <SuccessMessage ref={successRef} />
      <Table
        columns={columns}
        dataSource={dataSource}
        loading={{
          spinning: loading || delLoading || updLoading,
          indicator: <LoadingOutlined />,
          size: 'large',
        }}
        scroll={{ x: true }}
        rowKey={({ id, video }) => (video ? 'video' + id : 'article' + id)}
        pagination={{
          position: ['bottomLeft'],
          current: pageNum,
          pageSize,
          showSizeChanger: true,
          simple: true,
          size: 'small',
          showTotal(total, range) {
            return `${range[0]}-${range[1]} / ${total}`;
          },
          onChange(pageNum, pageSize) {
            setPageNum(pageNum);
            setPageSize(pageSize);
            run({ pageNum, pageSize });
          },
          total: data?.data.total,
        }}
      />
    </>
  );
}
