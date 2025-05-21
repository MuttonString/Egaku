from pydantic import BaseModel
from typing import Optional, Dict

class UserSignup(BaseModel):
    account: str
    email: str
    password: str
    code: str

class UserLogin(BaseModel):
    accountOrEmail: str
    password: str

class UserReset(BaseModel):
    email: str
    password: str
    code: str

class UserSendCode(BaseModel):
    email: str
    isNewEmail: bool

class UserUpdate(BaseModel):
    nickname: str
    sex: int
    desc: str
    avatar: str
    showReminder: Dict[str, bool]

class ArticleSubmit(BaseModel):
    title: str
    content: str
    plainText: str

class VideoSubmit(BaseModel):
    title: str
    cover: str
    video: str

class CommonUid(BaseModel):
    uid: Optional[str] = None

class CommonList(BaseModel):
    uid: Optional[str] = None
    pageNum: int
    pageSize: int

class CommonUpd(BaseModel):
    id: str
    type: int
    status: int
    desc: Optional[str] = None

class CommonId(BaseModel):
    id: str
    type: Optional[int] = None

class UserGetComment(BaseModel):
    id: str
    type: int
    pageNum: int
    pageSize: int

class UserSendComment(BaseModel):
    id: str
    type: int
    content: str

class ArticleSummary(BaseModel):
    title: str
    content: str

class UserGetReply(BaseModel):
    pageNum: int
    pageSize: int

class CommonSearch(BaseModel):
    content: str
    pageNum: int
    pageSize: int