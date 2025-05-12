from fastapi import APIRouter
from .database import db
from .models import *
from .schemas import *
from .utils import *

router = APIRouter(prefix="/api")

@router.post('/user/signup')
def user_signup(data: UserSignup):
    try:
        if db.query(User).filter(User.account == data.account).first():
            return error('ACCOUNT_EXIST')
        if db.query(User).filter(User.email == data.email).first():
            return error('EMAIL_EXIST')
        verification = db.query(Verification).filter(Verification.email == data.email).order_by(Verification.expire_time.desc()).first()
        if verification.code != data.code or verification.expire_time < time():
            return error('CODE_ERROR')
        new_user = User(
            account=data.account,
            email=data.email,
            password=hash_password(data.password, data.account, data.email),
            exp=0,
            signup_time=time(),
            admin=False,
        )
        db.add(new_user)
        db.commit()
        return success()
    except Exception as e:
        print(e.args)
        return error()
    
@router.post('/user/login')
def user_login(data: UserLogin):
    try:
        isEmail = '@' in data.accountOrEmail
        user = db.query(User).filter(
            User.email == data.accountOrEmail if isEmail else User.account == data.accountOrEmail
        ).first()
        if not user:
            return error('NOT_CORRECT')
        if user.password != hash_password(data.password, user.account, user.email):
            return error('NOT_CORRECT')
        new_token = Token(
            token=token(),
            expire_time=time() + 10 * 60 * 1000,
        )
        db.add(new_token)
        db.commit()
        return success({
            'token': new_token.token,
            'account': user.account,
        })
    except Exception as e:
        print(e.args)
        return error()
    
@router.post('/user/reset')
def user_reset(data: UserReset):
    try:
        user = db.query(User).filter(User.email == data.email).first()
        if not user:
            return error('EMAIL_NOT_EXIST')
        verification = db.query(Verification).filter(Verification.email == data.email).order_by(Verification.expire_time.desc()).first()
        if verification.code != data.code or verification.expire_time < time():
            return error('CODE_ERROR')
        user.password = hash_password(data.password, user.account, user.email)
        db.commit()
        return success()
    except Exception as e:
        print(e.args)
        return error()

@router.post('/user/sendCode')
def user_send_code(data: UserSendCode):
    try:
        user = db.query(User).filter(User.email == data.email).first()
        if data.isNewEmail and user:
            return error('EMAIL_EXIST')
        if not data.isNewEmail and not user:
            return error('EMAIL_NOT_EXIST')
        code=generate_code()
        new_code = Verification(
            email=data.email,
            code=code,
            expire_time=time() + 5 * 60 * 1000
        )
        db.add(new_code)
        db.commit()
        send_code(code, data.email, data.lang)
        return success()
    except Exception as e:
        print(e.args)
        return error()