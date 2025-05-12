from pydantic import BaseModel
from typing import Optional

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
    lang: str
    isNewEmail: bool