import { forwardRef, Ref, useImperativeHandle } from 'react';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';

export interface ISuccessMessage {
  open: (msg?: string) => void;
}

function SuccessMessage(_: unknown, ref: Ref<ISuccessMessage>) {
  const { t } = useTranslation();
  const [messageApi, contextHolder] = message.useMessage();

  useImperativeHandle(ref, () => ({
    open(msg) {
      messageApi.open({
        type: 'success',
        content: t('successMessage.title', { msg }),
      });
    },
  }));

  return contextHolder;
}

export default forwardRef(SuccessMessage);
