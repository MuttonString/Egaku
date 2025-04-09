/**
 * 将多个CSS类合并到一起
 * @param classnames CSS类名
 * @returns 合并后的CSS类
 */
export default function classnames(
  ...classnames: (undefined | null | boolean | string | number)[]
) {
  return classnames.filter((val) => val).join(' ');
}
