import request, { Response } from '../utils/request';

export async function submit(data: ArticleSubmitReq): Response {
  return await request.post('/article/submit', data);
}

export async function get(data: CommonReq): Response<ArticleGetRes> {
  return await request.post('/article/get', data);
}

export async function getAll(
  data: CommonListReq
): Response<CommonListRes<SubmissionPreviewObj>> {
  return await request.post('/article/getAll', data);
}

export async function summary(
  data: ArticleSummaryReq
): Response<ArticleSummaryRes> {
  return await request.post('/article/summary', data);
}
