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
  token?: string;
  account?: string;
  email?: string;
}

interface UserResetReq {
  email: string;
  password: string;
  code: string;
}

interface UserSendCodeReq {
  email: string;
  isNewEmail?: boolean;
}

type ReminderType = 'reply' | 'like' | 'notice';

interface UserGetInfoRes {
  uid?: string;
  account?: string;
  email?: string;
  sex?: number;
  nickname?: string;
  avatar?: string;
  desc?: string;
  exp?: number;
  signupTime?: number;
  admin?: boolean;
  msgNum?: Record<NotificationType, number>;
  showReminder?: Record<ReminderType, boolean>;
}

interface UploadFileRes {
  url?: string;
}

interface UserUpdateReq {
  nickname: string;
  sex: number;
  desc: string;
  avatar: string;
  showReminder: Record<ReminderType, boolean>;
}

interface ArticleSubmitReq {
  title: string;
  content: string;
}

interface VideoSubmitReq {
  title: string;
  cover: string;
  video: string;
}
