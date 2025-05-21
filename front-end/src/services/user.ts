import request from '../utils/request';
import { Response } from '../utils/request';

export async function signup(data: UserSignupReq): Response {
  return await request.post('/user/signup', data);
}

export async function login(data: UserLoginReq): Response<UserLoginRes> {
  return await request.post('/user/login', data);
}

export async function reset(data: UserResetReq): Response<UserResetReq> {
  return await request.post('/user/reset', data);
}

export async function sendCode(data: UserSendCodeReq): Response {
  return await request.post('/user/sendCode', data);
}

export async function getInfo(data?: UserGetInfoReq): Response<UserGetInfoRes> {
  return await request.post('/user/getInfo', data || {});
}

export async function update(data: UserUpdateReq): Response {
  return await request.post('/user/update', data);
}

export async function getSubmission(
  data: CommonListReq
): Response<CommonListRes<SubmissionObj>> {
  return await request.post('/user/getSubmission', data);
}

export async function delSubmission(data: CommonReq): Response {
  return await request.post('/user/delSubmission', data);
}

export async function updSubmission(data: CommonUpdReq): Response {
  return await request.post('/user/updSubmission', data);
}

export async function getCollection(
  data: CommonListReq
): Response<CommonListRes<CollectionObj>> {
  return await request.post('/user/getCollection', data);
}

export async function delCollection(data: CommonReq): Response {
  return await request.post('/user/delCollection', data);
}

export async function isFollowed(data: CommonReq): Response<UserIsFollowedRes> {
  return await request.post('/user/isFollowed', data);
}

export async function follow(data: CommonReq): Response {
  return await request.post('/user/follow', data);
}

export async function followCancel(data: CommonReq): Response {
  return await request.post('/user/followCancel', data);
}

export async function isCollected(
  data: CommonReq
): Response<UserIsCollectedRes> {
  return await request.post('/user/isCollected', data);
}

export async function collect(data: CommonReq): Response {
  return await request.post('/user/collect', data);
}

export async function collectCancel(data: CommonReq): Response {
  return await request.post('/user/collectCancel', data);
}

export async function getComment(
  data: CommonReq & CommonListReq
): Response<CommonListRes<CommentObj>> {
  return await request.post('/user/getComment', data);
}

export async function sendComment(data: SendCommentReq): Response {
  return await request.post('/user/sendComment', data);
}

export async function delComment(data: CommonReq): Response {
  return await request.post('/user/delComment', data);
}

export async function getReply(
  data: CommonListReq
): Response<CommonListRes<ReplyObj>> {
  return await request.post('/user/getReply', data);
}

export async function getDetailInfo(
  data?: UserGetInfoReq
): Response<UserGetDetailInfoRes> {
  return await request.post('/user/getDetailInfo', data || {});
}

export async function getSubmissionPreview(
  data?: CommonListReq
): Response<CommonListRes<SubmissionPreviewObj>> {
  return await request.post('/user/getSubmissionPreview', data);
}

export async function getFollowed(
  data: CommonListReq
): Response<CommonListRes<UserGetInfoRes>> {
  return await request.post('/user/getFollowed', data);
}

export async function getFollowedSubmission(
  data: CommonListReq
): Response<CommonListRes<SubmissionPreviewObj>> {
  return await request.post('/user/getFollowedSubmission', data);
}

export async function isAdmin(): Response<UserIsAdminRes> {
  return await request.post('/user/isAdmin');
}

export async function getSubmissionNeedReview(
  data: CommonListReq
): Response<CommonListRes<SubmissionObj>> {
  return await request.post('/user/getSubmissionNeedReview', data);
}
