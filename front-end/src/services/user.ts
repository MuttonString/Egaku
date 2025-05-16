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

export async function getInfo(): Response<UserGetInfoRes> {
  return await request.post('/user/getInfo');
}

export async function update(data: UserUpdateReq): Response {
  return await request.post('/user/update', data);
}
