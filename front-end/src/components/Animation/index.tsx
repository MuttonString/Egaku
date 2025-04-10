import { useThrottleFn } from 'ahooks';
import { CSSProperties, ReactNode, useState } from 'react';
import styles from './index.module.less';
import classnames from '../../utils/classnames';

interface IProps {
  animation?: 'spin' | 'bounce';
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}

export default function Animation(props: IProps) {
  const { animation, children, style, className } = props;

  const [animationName, setAnimationName] = useState('');

  const performSpin = useThrottleFn(
    () => {
      setAnimationName('spin');
      setTimeout(() => setAnimationName(''), 300);
    },
    { wait: 500, leading: true }
  ).run;

  const performBounceStart = useThrottleFn(
    () => {
      setAnimationName('bounce-start');
    },
    { wait: 500, leading: true }
  ).run;

  const performBounceEnd = useThrottleFn(
    () => {
      if (animationName !== 'bounce-start') return;
      setAnimationName('bounce-end');
      setTimeout(() => setAnimationName(''), 200);
    },
    { wait: 500, leading: true }
  ).run;

  return (
    <div
      style={style}
      className={classnames(className, styles.container, styles[animationName])}
      onMouseDown={() => {
        switch (animation) {
          case 'bounce':
            performBounceStart();
            break;
          case 'spin':
            performSpin();
            break;
        }
      }}
      onMouseLeave={animation === 'bounce' ? performBounceEnd : undefined}
      onMouseUp={animation === 'bounce' ? performBounceEnd : undefined}
    >
      {children}
    </div>
  );
}
