/**
 * 将文件转换为Base64编码
 * @param file 文件
 * @returns Base64编码
 */
export default function (file: File) {
  return new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = (reader.result as string);
      resolve(base64String);
    };
  });
}
