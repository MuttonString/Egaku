import request, { Response } from '../utils/request';

export async function submit(data: ArticleSubmitReq): Response {
  return await request.post('/article/submit', data);
}
