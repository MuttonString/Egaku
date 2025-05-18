import { Tag, TagProps, Tooltip } from 'antd';
import { useEffect, useState } from 'react';
import styles from './index.module.less';
import classnames from '../../utils/classnames';

interface IProps {
  exp?: number;
}

const COLORS = ['blue', 'green', 'gold', 'red', ''];
const NEXT = [100, 400, 1600, 3200];

export default function LevelTag(props: IProps & TagProps) {
  const [exp, setExp] = useState(props.exp);
  const [level, setLevel] = useState(0);

  useEffect(() => {
    setExp(props.exp);
    if (exp === undefined) {
      setLevel(0);
      return;
    }
    for (let i = 0; i < COLORS.length; i++) {
      if (exp < NEXT[i]) {
        setLevel(i + 1);
        return;
      }
    }
    setLevel(NEXT.length + 1);
  }, [exp, props.exp]);

  return (
    <Tooltip title={`${exp} / ${NEXT[level - 1] || '∞'}`} arrow={false}>
      <Tag
        color={level ? COLORS[level - 1] : undefined}
        className={classnames(
          styles.tag,
          level === COLORS.length && styles.max,
          props.className
        )}
        {...props}
      >
        LV{level}
      </Tag>
    </Tooltip>
  );
}
