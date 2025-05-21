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
      let msg = err instanceof Error ? err.message : err;
      switch (msg) {
        case 'NOT_LOGIN':
          msg = t('errorNotification.notLogin');
          break;
        case 'SERVER_ERROR':
          msg = t('errorNotification.serverError');
          break;
        case 'NO_PERMISSION':
          msg = t('errorNotification.noPermission');
          break;
        case 'PARAM_ERROR':
          msg = t('errorNotification.paramError');
          break;
        case 'CANNOT_OPERATION_TO_SELF':
          msg = t('errorNotification.cannotOperationToSelf');
          break;
      }
      api['error']({
        message: t('errorNotification.title'),
        description: msg,
        placement: 'bottomRight',
      });
    },
  }));

  return contextHolder;
}

export default forwardRef(ErrorNotification);
