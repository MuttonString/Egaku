/**
 * 将超过指定尺寸的图片进行压缩
 * @param file 图片文件
 * @param maxSize 最大尺寸
 * @returns 压缩后的图片
 */
export function imgResize(file: File, maxSize: number): Promise<File> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxSize || height > maxSize) {
          const scale = Math.min(maxSize / width, maxSize / height);
          width = width * scale;
          height = height * scale;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            const compressedFile = new File([blob!], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          'image/jpeg',
          1
        );
      };
      img.src = event.target!.result as string;
    };
    reader.readAsDataURL(file);
  });
}
