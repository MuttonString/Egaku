from fastapi import APIRouter, Header, UploadFile, File
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
            password='',
            exp=0,
            signup_time=time(),
            admin=False,
        )
        db.add(new_user)
        db.flush()
        db.refresh(new_user)
        new_user.password = hash_password(data.password, new_user.uid)
        db.commit()
        db.query(Verification).filter(Verification.email == data.email).delete()
        db.commit()
        return success()
    except Exception as e:
        db.rollback()
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
        if user.password != hash_password(data.password, user.uid):
            return error('NOT_CORRECT')
        new_token = Token(
            uid=user.uid,
            token=token(),
            expire_time=time() + 24 * 60 * 60 * 1000,
        )
        db.add(new_token)
        db.commit()
        return success({
            'token': new_token.token,
            'account': user.account,
        })
    except Exception as e:
        db.rollback()
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
        user.password = hash_password(data.password, user.uid)
        db.commit()
        db.query(Verification).filter(Verification.email == data.email).delete()
        db.commit()
        db.query(Token).filter(Token.uid == user.uid).delete()
        db.commit()
        return success()
    except Exception as e:
        db.rollback()
        print(e.args)
        return error()

@router.post('/user/sendCode')
def user_send_code(data: UserSendCode, lang: str = Header(None)):
    try:
        user = db.query(User).filter(User.email == data.email).first()
        if data.isNewEmail and user:
            return error('EMAIL_EXIST')
        if not data.isNewEmail and not user:
            return error('EMAIL_NOT_EXIST')
        db.query(Verification).filter(Verification.email == data.email).delete()
        db.commit()
        code=generate_code()
        new_code = Verification(
            email=data.email,
            code=code,
            expire_time=time() + 5 * 60 * 1000
        )
        db.add(new_code)
        db.commit()
        send_code(code, data.email, lang)
        return success()
    except Exception as e:
        db.rollback()
        print(e.args)
        return error()

@router.post('/user/getInfo')
def user_get_info(token: str = Header(None)):
    try:
        uid = verify_token(token)
        if not uid:
            return error('NOT_LOGIN')
        user = db.query(User).filter(User.uid == uid).first()
        return success({
            'uid': user.uid,
            'account': user.account,
            'email': mask_email(user.email),
            'sex': user.sex,
            'nickname': user.nickname,
            'avatar': user.avatar,
            'desc': user.desc,
            'exp': user.exp,
            'signupTime': user.signup_time,
            'admin': user.admin,
            'msgNum': { # TODO
                'reply': 0,
                'like': 2,
                'notice': 1, 
            },
            'showReminder': {
                'reply': (user.disable_reminder or 0) & 0b001 == 0,
                'like': (user.disable_reminder or 0) & 0b010 == 0,
                'notice': (user.disable_reminder or 0) & 0b100 == 0,
            },
        })
    except Exception as e:
        db.rollback()
        print(e.args)
        return error()

@router.post('/user/update')
def user_update(data: UserUpdate, token: str = Header(None)):
    try:
        uid = verify_token(token)
        if not uid:
            return error('NOT_LOGIN')
        user = db.query(User).filter(User.uid == uid).first()
        user.sex = data.sex
        user.nickname = data.nickname
        user.desc = data.desc
        user.avatar = data.avatar
        rem = data.showReminder
        user.disable_reminder = (not rem.get('reply')) * 0b001 + (not rem.get('like')) * 0b010 + (not rem.get('notice')) * 0b100
        db.commit()
        return success()
    except Exception as e:
        db.rollback()
        print(e.args)
        return error()

@router.post('/uploadFile')
async def upload_file(file: UploadFile = File(..., max_size=1024*1024*1024), token: str = Header(None)):
    try:
        uid = verify_token(token)
        if not uid:
            return error('NOT_LOGIN')
        file_url = await save_file(file)
        new_file = UploadedFile(
            url=file_url,
            filename=file.filename,
            uid=uid,
            upload_time=time()
        )
        db.add(new_file)
        db.commit()
        return success({
            'url': file_url
        })
    except Exception as e:
        db.rollback()
        print(e.args)
        return error()

@router.post('/article/submit')
def article_submit(data: ArticleSubmit, token: str = Header(None)):
    try:
        uid = verify_token(token)
        if not uid:
            return error('NOT_LOGIN')
        new_article = Article(
            uid=uid,
            submit_time=time(),
            title=data.title,
            content=data.content,
            status=0
        )
        db.add(new_article)
        db.commit()
        # TODO: 将data.title和content用AI审核，然后将状态改为1或2
        return success()
    except Exception as e:
        db.rollback()
        print(e.args)
        return error()

@router.post('/video/submit')
def article_submit(data: VideoSubmit, token: str = Header(None)):
    try:
        uid = verify_token(token)
        if not uid:
            return error('NOT_LOGIN')
        new_video = Video(
            uid=uid,
            submit_time=time(),
            title=data.title,
            cover=data.cover,
            video=data.video,
            status=0
        )
        db.add(new_video)
        db.commit()
        # TODO: 将data.title cover video用AI审核，然后将状态改为1或2
        return success()
    except Exception as e:
        db.rollback()
        print(e.args)
        return error()