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