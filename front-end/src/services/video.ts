import request, { Response } from '../utils/request';

export async function submit(data: VideoSubmitReq): Response {
  return await request.post('/video/submit', data);
}

export async function getAll(
  data: CommonListReq
): Response<CommonListRes<SubmissionPreviewObj>> {
  return await request.post('/video/getAll', data);
}

export async function get(data: CommonReq): Response<VideoGetRes> {
  return await request.post('/video/get', data);
}
