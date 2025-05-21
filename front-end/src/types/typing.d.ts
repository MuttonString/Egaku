interface CommonListReq {
  uid?: string;
  pageNum: number;
  pageSize: number;
}

interface CommonListRes<T> {
  total?: number;
  dataList?: T[];
}

interface CommonReq {
  id: string;
  type?: number;
}

interface CommonUpdReq {
  id: string;
  type: number;
  status: number;
  desc?: string;
}

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

type ReminderType = 'reply';

interface UserGetInfoReq {
  uid?: string;
}

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
  plainText: string;
}

interface VideoSubmitReq {
  title: string;
  cover: string;
  video: string;
}

interface SubmissionObj {
  id: string;
  submitTime: number;
  title: string;
  content?: string;
  preview?: string;
  cover?: string;
  video?: string;
  status: number;
  desc?: string;
}

interface CollectionObj {
  id: string;
  submissionId: string;
  time: number;
  title: string;
  type: number;
  preview: string;
}

interface VideoGetRes {
  uploader?: {
    uid: string;
    account: string;
    nickname: string;
    avatar: string;
    sex: number;
    exp: number;
    canFollow: boolean;
  };
  submitTime?: number;
  title?: string;
  cover?: string;
  video?: string;
}

interface ArticleGetRes {
  uploader?: {
    uid: string;
    account: string;
    nickname: string;
    avatar: string;
    sex: number;
    exp: number;
    canFollow: boolean;
  };
  submitTime?: number;
  title?: string;
  content?: string;
}

interface UserIsFollowedRes {
  followed?: boolean;
}

interface UserIsCollectedRes {
  collected?: boolean;
}

interface CommentObj {
  id: string;
  content: string;
  time: number;
  sender: {
    uid: string;
    account: string;
    sex: number;
    nickname: string;
    avatar: string;
    exp: number;
  };
  canDelete: boolean;
}

interface SendCommentReq {
  id: string;
  type: number;
  content: string;
}

interface ArticleSummaryReq {
  title: string;
  content: string;
}

interface ArticleSummaryRes {
  summary?: string;
}

interface ReplyObj {
  id: string;
  submissionId: string;
  title: string;
  uid: string;
  account: string;
  nickname: string;
  content: string;
  time: number;
  type: number;
}

interface UserGetDetailInfoRes {
  uid?: string;
  account?: string;
  sex?: number;
  nickname?: string;
  avatar?: string;
  desc?: string;
  exp?: number;
  signupTime?: number;
  articleTotal?: number;
  videoTotal?: number;
  followerTotal?: number;
  canFollow?: boolean;
}

interface SubmissionPreviewObj {
  id: string;
  submitTime: string;
  title: string;
  preview: string;
  type?: number;
  uploaderAccount?: string;
  uploaderNickname?: string;
}

interface CommonSearchReq extends CommonListReq {
  content: string;
}

interface UserIsAdminRes {
  isAdmin?: boolean;
}
