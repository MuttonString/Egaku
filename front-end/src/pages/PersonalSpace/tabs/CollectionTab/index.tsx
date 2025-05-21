import { Button, Table } from 'antd';
import type { TableProps } from 'antd';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRequest } from 'ahooks';
import { delCollection, getCollection } from '../../../../services/user';
import ErrorNotification from '../../../../components/ErrorNotification';
import type { IErrorNotification } from '../../../../components/ErrorNotification';
import SuccessMessage from '../../../../components/SuccessMessage';
import type { ISuccessMessage } from '../../../../components/SuccessMessage';
import { LoadingOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { SUBMISSION_TYPE } from '../../../../types/enums';

export default function CollectionTab() {
  const { t } = useTranslation();
  const errorRef = useRef<IErrorNotification>(null);
  const successRef = useRef<ISuccessMessage>(null);
  const [dataSource, setDataSource] = useState<CollectionObj[]>();
  const [pageNum, setPageNum] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, run, loading } = useRequest(getCollection, {
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

  const { run: delRun, loading: delLoading } = useRequest(delCollection, {
    manual: true,
    onSuccess(data) {
      if (data.success) {
        successRef.current!.open(t('personal.collection.remove'));
        run({ pageNum, pageSize });
      } else {
        errorRef.current!.open(data.data.error);
      }
    },
    onError(err) {
      errorRef.current!.open(err);
    },
  });

  const columns: TableProps<CollectionObj>['columns'] = useMemo(
    () => [
      {
        title: t('personal.collection.title'),
        key: 'title',
        dataIndex: 'title',
      },
      {
        title: t('personal.collection.preview'),
        key: 'preview',
        dataIndex: 'preview',
        render(data, { type }) {
          if (type === SUBMISSION_TYPE.VIDEO) {
            return <img src={data} alt="" width={200} />;
          } else {
            return data.length > 50 ? data.substring(0, 50) + '...' : data;
          }
        },
      },
      {
        title: t('personal.collection.time'),
        key: 'time',
        dataIndex: 'time',
        render(data) {
          return dayjs(data).format('lll');
        },
      },
      {
        key: 'operation',
        render(_, { id, type }) {
          return (
            <Button
              onClick={(e) => {
                delRun({ id, type });
                e.stopPropagation();
              }}
            >
              {t('personal.collection.remove')}
            </Button>
          );
        },
      },
    ],
    [delRun, t]
  );

  return (
    <>
      <ErrorNotification ref={errorRef} />
      <SuccessMessage ref={successRef} />
      <Table
        columns={columns}
        dataSource={dataSource}
        loading={{
          spinning: loading || delLoading,
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
