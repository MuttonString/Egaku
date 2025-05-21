import { Flex, Table } from 'antd';
import type { TableProps } from 'antd';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRequest } from 'ahooks';
import { getReply } from '../../../../services/user';
import ErrorNotification from '../../../../components/ErrorNotification';
import type { IErrorNotification } from '../../../../components/ErrorNotification';
import SuccessMessage from '../../../../components/SuccessMessage';
import type { ISuccessMessage } from '../../../../components/SuccessMessage';
import {
  LoadingOutlined,
  PlaySquareOutlined,
  ReadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { SUBMISSION_TYPE } from '../../../../types/enums';

export default function ReplyTab() {
  const { t } = useTranslation();
  const errorRef = useRef<IErrorNotification>(null);
  const successRef = useRef<ISuccessMessage>(null);
  const [dataSource, setDataSource] = useState<ReplyObj[]>();
  const [pageNum, setPageNum] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, run, loading } = useRequest(getReply, {
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

  const columns: TableProps<ReplyObj>['columns'] = useMemo(
    () => [
      {
        title: t('personal.reply.title'),
        key: 'title',
        dataIndex: 'title',
        render(data, { type, submissionId }) {
          if (type == SUBMISSION_TYPE.ARTICLE) {
            return (
              <a
                onClick={(e) => {
                  e.preventDefault();
                  window.open('/article/' + submissionId);
                }}
              >
                <Flex gap={8}>
                  <ReadOutlined />
                  {data}
                </Flex>
              </a>
            );
          } else {
            return (
              <a
                onClick={(e) => {
                  e.preventDefault();
                  window.open('/video/' + submissionId);
                }}
              >
                <Flex gap={8}>
                  <PlaySquareOutlined />
                  {data}
                </Flex>
              </a>
            );
          }
        },
      },
      {
        title: t('personal.reply.user'),
        key: 'user',
        render(_, { uid, account, nickname }) {
          return (
            <a
              onClick={(e) => {
                e.preventDefault();
                window.open('/submission/' + uid);
              }}
            >
              {nickname || account}
            </a>
          );
        },
      },
      {
        title: t('personal.reply.time'),
        key: 'time',
        dataIndex: 'time',
        render(data) {
          return dayjs(data).format('lll');
        },
      },
      {
        title: t('personal.reply.content'),
        key: 'content',
        dataIndex: 'content',
      },
    ],
    [t]
  );

  return (
    <>
      <ErrorNotification ref={errorRef} />
      <SuccessMessage ref={successRef} />
      <Table
        columns={columns}
        dataSource={dataSource}
        size="small"
        loading={{
          spinning: loading,
          indicator: <LoadingOutlined />,
          size: 'large',
        }}
        scroll={{ x: true }}
        rowKey="id"
        onRow={({ submissionId, type }) => ({
          onClick() {
            if (type === SUBMISSION_TYPE.ARTICLE) {
              window.open('/article/' + submissionId);
            } else {
              window.open('/video/' + submissionId);
            }
          },
        })}
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
