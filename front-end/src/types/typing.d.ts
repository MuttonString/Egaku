interface UserSignupReq {
  account: string;
  email: string;
  password: string;
  code: string;
}

interface UserLoginReq {
  accountOrEmail: string;
  password: string;
}

interface UserLoginRes {
  token: string;
  account: string;
  email: string;
}

interface UserResetReq {
  email: string;
  password: string;
  code: string;
}

interface UserSendCodeReq {
  email: string;
  lang: string;
  isNewEmail?: boolean;
}
