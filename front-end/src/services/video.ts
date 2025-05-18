import request, { Response } from '../utils/request';

export async function submit(data: VideoSubmitReq): Response {
  return await request.post('/video/submit', data);
}
