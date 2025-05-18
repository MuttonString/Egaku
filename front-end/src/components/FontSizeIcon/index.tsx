import { FontSizeOutlined } from '@ant-design/icons';
import styles from './index.module.less';

interface IProps {
  color?: string;
  iconSize?: number;
  fontSize?: number;
}

export default function FontSizeIcon(props: IProps) {
  const size = props.iconSize ? `${props.iconSize}px` : '1em';
  const { color, fontSize } = props;
  return (
    <div className={styles.icon} style={{ color, fontSize: size }}>
      <FontSizeOutlined />
      <span className={styles.num}>{fontSize}x</span>
    </div>
  );
}
