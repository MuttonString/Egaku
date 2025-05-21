import { Drawer } from 'antd';
import type { DrawerProps } from 'antd';
import { forwardRef, Ref, useImperativeHandle, useState } from 'react';
import styles from './index.module.less';

export interface IAIDrawer {
  open: () => void;
}

function AIDrawer(_: DrawerProps, ref: Ref<IAIDrawer>) {
  const [open, setOpen] = useState(false);

  useImperativeHandle(ref, () => ({
    open() {
      setOpen(true);
    },
  }));

  return (
    <Drawer
      title="Kimi"
      size="large"
      open={open}
      onClose={() => setOpen(false)}
      className={styles.drawer}
    >
      <iframe src="https://www.kimi.com/" loading="lazy" />
    </Drawer>
  );
}

export default forwardRef(AIDrawer);
