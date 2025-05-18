import { forwardRef, Ref, useImperativeHandle } from 'react';
import { notification } from 'antd';
import { useTranslation } from 'react-i18next';

export interface IErrorNotification {
  open: (err?: Error | string) => void;
}

function ErrorNotification(_: unknown, ref: Ref<IErrorNotification>) {
  const { t } = useTranslation();
  const [api, contextHolder] = notification.useNotification();

  useImperativeHandle(ref, () => ({
    open(err) {
      api['error']({
        message: t('errorNotification.title'),
        description: err instanceof Error ? err.message : err,
        placement: 'bottomRight',
      });
    },
  }));

  return contextHolder;
}

export default forwardRef(ErrorNotification);
