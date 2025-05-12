import axios from 'axios';
import Cookies from 'js-cookie';
import { login } from '../services/user';

const request = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
  },
});

request.interceptors.request.use((cfg) => {
  const token = sessionStorage.getItem('token');
  if (token) cfg.headers.token = token;
  cfg.headers.timestamp = Date.now();
  return cfg;
});

request.interceptors.response.use(async (resp) => {
  if (!resp.data.success && resp.data.data.error === 'EXPIRED') {
    const account = Cookies.get('account');
    const pwd = Cookies.get('pwd');
    if (account && pwd) {
      Cookies.set('account', account, { expires: 7 });
      Cookies.set('pwd', pwd, { expires: 7 });
      sessionStorage.setItem(
        'token',
        (await login({ accountOrEmail: account, password: pwd })).data.token
      );
      return request.request(resp.config);
    }
    return resp.data;
  }
  return resp.data;
});

export type Response<T = object> = Promise<{
  success: boolean;
  data: T & { error?: string };
}>;

export default request;
