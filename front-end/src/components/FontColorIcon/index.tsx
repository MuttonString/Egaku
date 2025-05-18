import { FontColorsOutlined } from '@ant-design/icons';
import styles from './index.module.less';

interface IProps {
  size?: number;
  iconColor?: string;
  fontColor?: string;
}

export default function FontColorIcon(props: IProps) {
  const size = props.size ? `${props.size}px` : '1em';
  const { iconColor, fontColor } = props;
  return (
    <div className={styles.icon} style={{ fontSize: size }}>
      <div
        className={styles.part}
        style={{
          color: iconColor,
          clipPath: 'inset(0 0 30% 0)',
        }}
      >
        <FontColorsOutlined />
      </div>
      <div
        className={styles.part}
        style={{
          color: fontColor,
          clipPath: 'inset(70% 0 0 0)',
        }}
      >
        <FontColorsOutlined />
      </div>
    </div>
  );
}
