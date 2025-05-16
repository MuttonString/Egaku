import request from '../utils/request';
import { Response } from '../utils/request';

export async function uploadFile(file: File): Response<UploadFileRes> {
  const formData = new FormData();
  formData.append('file', file);
  return await request.post('uploadFile', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}
