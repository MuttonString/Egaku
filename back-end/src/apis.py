from fastapi import APIRouter, Header, UploadFile, File
from sqlalchemy import union_all, desc, func, literal, or_
from .database import SessionLocal
from .models import *
from .schemas import *
from .utils import *

router = APIRouter(prefix="/api")

@router.post('/user/signup')
def user_signup(data: UserSignup):
    db = SessionLocal()
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
            remind_after=0,
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
    db = SessionLocal()
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
            expire_time=time() + 60 * 60 * 1000,
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
    db = SessionLocal()
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
    db = SessionLocal()
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
def user_get_info(data: CommonUid, token: str = Header(None)):
    db = SessionLocal()
    try:
        uid = data.uid or verify_token(token)
        if not uid:
            return error('NOT_LOGIN')
        user = db.query(User).filter(User.uid == uid).first()
        articles = db.query(Article.id).filter(Article.uid == uid)
        videos = db.query(Video.id).filter(Video.uid == uid)
        comment_total = db.query(Comment).filter(
            (Comment.uid != uid) & (Comment.time > user.remind_after) & ((
                (Comment.type == 0) & Comment.submission_id.in_(articles)
            ) | (
                (Comment.type == 1) & Comment.submission_id.in_(videos)
            ))).count()
        db.close()
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
            'msgNum': {
                'reply': comment_total,
            },
            'showReminder': {
                'reply': (user.disable_reminder or 0) & 1 == 0,
            },
        })
    except Exception as e:
        db.rollback()
        print(e.args)
        return error()

@router.post('/user/update')
def user_update(data: UserUpdate, token: str = Header(None)):
    db = SessionLocal()
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
        user.disable_reminder = (not rem.get('reply')) * 1
        db.commit()
        return success()
    except Exception as e:
        db.rollback()
        print(e.args)
        return error()

@router.post('/uploadFile')
async def upload_file(file: UploadFile = File(..., max_size=1024*1024*1024), token: str = Header(None)):
    db = SessionLocal()
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
    db = SessionLocal()
    try:
        uid = verify_token(token)
        if not uid:
            return error('NOT_LOGIN')
        new_article = Article(
            uid=uid,
            submit_time=time(),
            title=data.title,
            content=data.content,
            preview=data.plainText[:51],
            status=0
        )
        db.add(new_article)
        db.flush()
        db.refresh(new_article)
        id = new_article.id
        db.commit()
        review(data.plainText, 0, id, uid)
        return success()
    except Exception as e:
        db.rollback()
        print(e.args)
        return error()

@router.post('/video/submit')
def video_submit(data: VideoSubmit, token: str = Header(None)):
    db = SessionLocal()
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
        db.flush()
        db.refresh(new_video)
        id = new_video.id
        db.commit()
        review(data.video, 0, id, uid)
        return success()
    except Exception as e:
        db.rollback()
        print(e.args)
        return error()

@router.post('/user/getSubmission')
def user_get_submission(data: CommonList, token: str = Header(None)):
    db = SessionLocal()
    try:
        uid = data.uid or verify_token(token)
        if not uid:
            return error('NOT_LOGIN')
        articles = db.query(
                            Article.id,
                            Article.submit_time,
                            Article.title,
                            Article.content,
                            Article.preview,
                            literal(None).label('cover'),
                            literal(None).label('video'),
                            Article.status,
                            Article.desc,
                        ).filter(Article.uid == uid)
        videos = db.query(
                            Video.id,
                            Video.submit_time,
                            Video.title,
                            literal(None).label('content'),
                            literal(None).label('preview'),
                            Video.cover,
                            Video.video,
                            Video.status,
                            Video.desc,
                        ).filter(Video.uid == uid)
        combined = articles.union_all(videos).order_by(desc(Article.submit_time))
        total = db.execute(db.query(func.count()).select_from(combined.subquery())).scalar()
        result = combined.limit(data.pageSize).offset((data.pageNum - 1) * data.pageSize).all()
        db.close()
        return success({
            'total': total,
            'dataList': list(map(lambda obj: {
                    'id': obj.id,
                    'submitTime': obj.submit_time,
                    'title': obj.title,
                    'content': obj.content,
                    'preview': obj.preview,
                    'cover': obj.cover,
                    'video': obj.video,
                    'status': obj.status,
                    'desc': obj.desc,
                }, result)),
        })
    except Exception as e:
        db.rollback()
        print(e.args)
        return error()

@router.post('/user/delSubmission')
def user_del_submission(data: CommonId, token: str = Header(None)):
    db = SessionLocal()
    try:
        uid = verify_token(token)
        if not uid:
            return error('NOT_LOGIN')
        admin = db.query(User).filter(User.uid == uid).first().admin
        if data.type == 0:
            article_query = db.query(Article).filter(Article.id == data.id)
            if article_query.first().uid != uid or not admin:
                return error('NO_PERMISSION')
            article_query.delete()
        elif data.type == 1:
            video_query = db.query(Video).filter(Video.id == data.id)
            if video_query.first().uid != uid or not admin:
                return error('NO_PERMISSION')
            video_query.delete()
        else:
            return error('PARAM_ERROR')
        db.commit()
        return success()
    except Exception as e:
        db.rollback()
        print(e.args)
        return error()

@router.post('/user/updSubmission')
def user_upd_submission(data: CommonUpd, token: str = Header(None)):
    db = SessionLocal()
    try:
        uid = verify_token(token)
        if not uid:
            return error('NOT_LOGIN')
        admin = db.query(User).filter(User.uid == uid).first().admin
        if data.status != 3 and not admin:
            return error('NO_PERMISSION')
        if data.type == 0:
            article = db.query(Article).filter(Article.id == data.id).first()
            if article.uid != uid and not admin:
                return error('NO_PERMISSION')
            article.status = data.status
            if data.desc != None:
                article.desc = data.desc
        elif data.type == 1:
            video = db.query(Video).filter(Video.id == data.id).first()
            if video.uid != uid and not admin:
                return error('NO_PERMISSION')
            video.status = data.status
            if data.desc != None:
                video.desc = data.desc
        else:
            return error('PARAM_ERROR')
        db.commit()
        return success()
    except Exception as e:
        db.rollback()
        print(e.args)
        return error()

@router.post('/user/getCollection')
def user_get_collection(data: CommonList, token: str = Header(None)):
    db = SessionLocal()
    try:
        uid = verify_token(token)
        if not uid:
            return error('NOT_LOGIN')
        collections = db.query(Collection).filter(Collection.uid == uid).order_by(desc(Collection.time))
        total = db.execute(db.query(func.count()).select_from(collections.subquery())).scalar()
        collection_result = collections.limit(data.pageSize).offset((data.pageNum - 1) * data.pageSize).all()
        result_list = []
        for collection in collection_result:
            type = collection.type
            if type == 0:
                article = db.query(Article).filter(Article.id == collection.submission_id).first()
                result_list.append({
                    'id': collection.id,
                    'submissionId': article.id,
                    'title': article.title,
                    'preview': article.preview,
                    'time': collection.time,
                    'type': 0,
                })
            elif type == 1:
                video = db.query(Video).filter(Video.id == collection.submission_id).first()
                result_list.append({
                    'id': collection.id,
                    'submissionId': video.id,
                    'title': video.title,
                    'preview': video.cover,
                    'time': collection.time,
                    'type': 1,
                })
        db.close()
        return success({ 'total': total, 'dataList': result_list })
    except Exception as e:
        db.rollback()
        print(e.args)
        return error()

@router.post('/user/delCollection')
def user_del_collection(data: CommonId, token: str = Header(None)):
    db = SessionLocal()
    try:
        uid = verify_token(token)
        if not uid:
            return error('NOT_LOGIN')
        collection_query = db.query(Collection).filter(Collection.submission_id == data.id, Collection.type == data.type)
        if collection_query.first().uid != uid:
            return error('NO_PERMISSION')
        collection_query.delete()
        db.commit()
        return success()
    except Exception as e:
        db.rollback()
        print(e.args)
        return error()

@router.post('/video/get')
def video_get(data: CommonId, token: str = Header(None)):
    db = SessionLocal()
    try:
        uid = verify_token(token)
        video = db.query(Video).filter(Video.id == data.id).first()
        if not video or video.status != 1:
            return error('NO_SUBMISSION')
        uploader = db.query(User).filter(User.uid == video.uid).first()
        db.close()
        return success({
            'uploader': {
                'uid': uploader.uid,
                'account': uploader.account,
                'nickname': uploader.nickname,
                'sex': uploader.sex,
                'avatar': uploader.avatar,
                'exp': uploader.exp,
                'canFollow': uid and uid != uploader.uid,
            },
            'submitTime': video.submit_time,
            'title': video.title,
            'cover': video.cover,
            'video': video.video,
        })
    except Exception as e:
        db.rollback()
        print(e.args)
        return error()

@router.post('/user/isFollowed')
def user_is_followed(data: CommonId, token: str = Header(None)):
    db = SessionLocal()
    try:
        uid = verify_token(token)
        if not uid:
            return error('NOT_LOGIN')
        follow = db.query(Follow).filter(Follow.uid == data.id, Follow.follower_id == uid).first()
        db.close()
        return success({
            'followed': bool(follow)
        })
    except Exception as e:
        db.rollback()
        print(e.args)
        return error()

@router.post('/user/follow')
def user_follow(data: CommonId, token: str = Header(None)):
    db = SessionLocal()
    try:
        uid = verify_token(token)
        if not uid:
            return error('NOT_LOGIN')
        if data.id == uid:
            return error('CANNOT_OPERATION_TO_SELF')
        new_follow = Follow(
            uid=data.id,
            follower_id=uid,
        )
        db.add(new_follow)
        db.commit()
        return success()
    except Exception as e:
        db.rollback()
        print(e.args)
        return error()

@router.post('/user/followCancel')
def user_follow_cancel(data: CommonId, token: str = Header(None)):
    db = SessionLocal()
    try:
        uid = verify_token(token)
        if not uid:
            return error('NOT_LOGIN')
        db.query(Follow).filter(Follow.uid == data.id, Follow.follower_id == uid).delete()
        db.commit()
        return success()
    except Exception as e:
        db.rollback()
        print(e.args)
        return error()

@router.post('/user/isCollected')
def user_is_collected(data: CommonId, token: str = Header(None)):
    db = SessionLocal()
    try:
        uid = verify_token(token)
        if not uid:
            return error('NOT_LOGIN')
        collection = db.query(Collection).filter(Collection.type == data.type, Collection.submission_id == data.id, Collection.uid == uid).first()
        db.close()
        return success({
            'collected': bool(collection)
        })
    except Exception as e:
        db.rollback()
        print(e.args)
        return error()

@router.post('/user/collect')
def user_collect(data: CommonId, token: str = Header(None)):
    db = SessionLocal()
    try:
        uid = verify_token(token)
        if not uid:
            return error('NOT_LOGIN')
        new_collection = Collection(
            uid=uid,
            submission_id=data.id,
            type=data.type,
            time=time(),
        )
        db.add(new_collection)
        db.commit()
        return success()
    except Exception as e:
        db.rollback()
        print(e.args)
        return error()

@router.post('/user/collectCancel')
def user_collect_cancel(data: CommonId, token: str = Header(None)):
    db = SessionLocal()
    try:
        uid = verify_token(token)
        if not uid:
            return error('NOT_LOGIN')
        db.query(Collection).filter(Collection.type == data.type, Collection.uid == uid, Collection.submission_id == data.id).delete()
        db.commit()
        return success()
    except Exception as e:
        db.rollback()
        print(e.args)
        return error()

@router.post('/user/getComment')
def user_get_comment(data: UserGetComment, token: str = Header(None)):
    db = SessionLocal()
    try:
        uid = verify_token(token)
        admin = False
        if uid:
            admin = bool(db.query(User).filter(User.uid == uid).first().admin)
        comments = db.query(Comment).filter(Comment.submission_id == data.id, Comment.type == data.type).order_by(Comment.time.desc())
        total = db.execute(db.query(func.count()).select_from(comments.subquery())).scalar()
        comment_result = comments.limit(data.pageSize).offset((data.pageNum - 1) * data.pageSize).all()
        comment_list = []
        for comment in comment_result:
            user = db.query(User).filter(User.uid == comment.uid).first()
            comment_list.append({
                'id': comment.id,
                'content': comment.content,
                'time': comment.time,
                'sender': {
                    'uid': comment.uid,
                    'account': user.account,
                    'sex': user.sex,
                    'nickname': user.nickname,
                    'avatar': user.avatar,
                    'exp': user.exp,
                },
                'canDelete': uid == comment.uid or admin,
            })
        db.close()
        return success({ 'total': total, 'dataList': comment_list })
    except Exception as e:
        db.rollback()
        print(e.args)
        return error()

@router.post('/user/sendComment')
def user_send_comment(data: UserSendComment, token: str = Header(None)):
    db = SessionLocal()
    try:
        uid = verify_token(token)
        if not uid:
            return error('NOT_LOGIN')
        new_comment = Comment(
            content=data.content,
            uid=uid,
            time=time(),
            submission_id=data.id,
            type=data.type,
        )
        db.add(new_comment)
        db.commit()
        exp_plus(uid, 3)
        return success()
    except Exception as e:
        db.rollback()
        print(e.args)
        return error()

@router.post('/user/delComment')
def user_del_comment(data: CommonId, token: str = Header(None)):
    db = SessionLocal()
    try:
        uid = verify_token(token)
        if not uid:
            return error('NOT_LOGIN')
        admin = bool(db.query(User).filter(User.uid == uid).first().admin)
        comment = db.query(Comment).filter(Comment.id == data.id)
        if comment.first().uid != uid or not admin:
            return error('NO_PERMISSION')
        comment.delete()
        db.commit()
        return success()
    except Exception as e:
        db.rollback()
        print(e.args)
        return error()

@router.post('/article/get')
def article_get(data: CommonId, token: str = Header(None)):
    db = SessionLocal()
    try:
        uid = verify_token(token)
        article = db.query(Article).filter(Article.id == data.id).first()
        if not article or article.status != 1:
            return error('NO_SUBMISSION')
        uploader = db.query(User).filter(User.uid == article.uid).first()
        db.close()
        return success({
            'uploader': {
                'uid': uploader.uid,
                'account': uploader.account,
                'nickname': uploader.nickname,
                'sex': uploader.sex,
                'avatar': uploader.avatar,
                'exp': uploader.exp,
                'canFollow': uid and uid != uploader.uid,
            },
            'submitTime': article.submit_time,
            'title': article.title,
            'content': article.content,
        })
    except Exception as e:
        db.rollback()
        print(e.args)
        return error()

@router.post('/article/summary')
def article_summary(data: ArticleSummary):
    try:
        return success({ 'summary': summary(data.title, data.content) })
    except Exception as e:
        print(e.args)
        return error()

@router.post('/user/getReply')
def user_get_reply(data: CommonList,token: str = Header(None)):
    db = SessionLocal()
    try:
        now = time()
        uid = verify_token(token)
        if not uid:
            return error('NOT_LOGIN')
        articles = db.query(Article.id).filter(Article.uid == uid)
        videos = db.query(Video.id).filter(Video.uid == uid)
        comments = db.query(Comment).filter((((Comment.uid != uid) &
                (Comment.type == 0) & Comment.submission_id.in_(articles)
            ) | (
                (Comment.type == 1) & Comment.submission_id.in_(videos)
            ))).order_by(Comment.time.desc())
        total = db.execute(db.query(func.count()).select_from(comments.subquery())).scalar()
        comment_result = comments.limit(data.pageSize).offset((data.pageNum - 1) * data.pageSize).all()
        reply_list = []
        for comment in comment_result:
            title = None
            user = db.query(User).filter(User.uid == comment.uid).first()
            if comment.type == 0:
                article = db.query(Article).filter(Article.id == comment.submission_id).first()
                title = article.title
            elif comment.type == 1:
                video = db.query(Video).filter(Video.id == comment.submission_id).first()
                title = video.title
            reply_list.append({
                'id': comment.id,
                'submissionId': comment.submission_id,
                'title': title,
                'uid': user.uid,
                'account': user.account,
                'nickname': user.nickname,
                'content': comment.content,
                'time': comment.time,
                'type': comment.type,
            })
        user = db.query(User).filter(User.uid == uid).first()
        user.remind_after = now
        db.commit()
        return success({ 'total': total, 'dataList': reply_list})
    except Exception as e:
        db.rollback()
        print(e.args)
        return error()

@router.post('/user/getDetailInfo')
def user_get_detail_info(data: CommonUid, token: str = Header(None)):
    db = SessionLocal()
    try:
        self_id = verify_token(token)
        uid = data.uid or self_id
        if not uid:
            return error('NOT_LOGIN')
        user = db.query(User).filter(User.uid == uid).first()
        if not user:
            return error('NO_USER')
        article_total = db.query(Article).filter(Article.uid == uid, Article.status == 1).count()
        video_total = db.query(Video).filter(Video.uid == uid, Video.status == 1).count()
        follower_total = db.query(Follow).filter(Follow.uid == uid).count()
        db.close()
        return success({
            'account': user.account,
            'sex': user.sex,
            'nickname': user.nickname,
            'avatar': user.avatar,
            'desc': user.desc,
            'exp': user.exp,
            'signupTime': user.signup_time,
            'articleTotal': article_total,
            'videoTotal': video_total,
            'followerTotal': follower_total,
            'canFollow': user.uid != self_id,
        })
    except Exception as e:
        db.rollback()
        print(e.args)
        return error()

@router.post('/user/getSubmissionPreview')
def user_get_submission(data: CommonList, token: str = Header(None)):
    db = SessionLocal()
    try:
        uid = data.uid or verify_token(token)
        if not uid:
            return error('NOT_LOGIN')
        articles = db.query(
                            Article.id,
                            Article.submit_time,
                            Article.title,
                            Article.preview,
                            literal(None).label('cover'),
                            literal(0).label('type'),
                        ).filter(Article.uid == uid, Article.status == 1)
        videos = db.query(
                            Video.id,
                            Video.submit_time,
                            Video.title,
                            literal(None).label('preview'),
                            Video.cover,
                            literal(1).label('type')
                        ).filter(Video.uid == uid, Video.status == 1)
        combined = articles.union_all(videos).order_by(desc(Article.submit_time))
        total = db.execute(db.query(func.count()).select_from(combined.subquery())).scalar()
        result = combined.limit(data.pageSize).offset((data.pageNum - 1) * data.pageSize).all()
        db.close()
        return success({
            'total': total,
            'dataList': list(map(lambda obj: {
                    'id': obj.id,
                    'submitTime': obj.submit_time,
                    'title': obj.title,
                    'preview': obj.preview or obj.cover,
                    'type': obj.type,
                }, result)),
        })
    except Exception as e:
        db.rollback()
        print(e.args)
        return error()

@router.post('/article/getAll')
def article_get_all(data: CommonList):
    db = SessionLocal()
    try:
        articles = db.query(Article).filter(Article.status == 1).order_by(desc(Article.submit_time))
        total = db.execute(db.query(func.count()).select_from(articles.subquery())).scalar()
        result = articles.limit(data.pageSize).offset((data.pageNum - 1) * data.pageSize).all()
        result_list = []
        for article in result:
            user = db.query(User).filter(User.uid == article.uid).first()
            result_list.append({
                'id': article.id,
                'submitTime': article.submit_time,
                'title': article.title,
                'preview': article.preview,
                'uploaderAccount': user.account,
                'uploaderNickname': user.nickname,
            })
        db.close()
        return success({ 'total': total, 'dataList': result_list })
    except Exception as e:
        db.rollback()
        print(e.args)
        return error()

@router.post('/video/getAll')
def video_get_all(data: CommonList):
    db = SessionLocal()
    try:
        videos = db.query(Video).filter(Video.status == 1).order_by(desc(Video.submit_time))
        total = db.execute(db.query(func.count()).select_from(videos.subquery())).scalar()
        result = videos.limit(data.pageSize).offset((data.pageNum - 1) * data.pageSize).all()
        result_list = []
        for video in result:
            user = db.query(User).filter(User.uid == video.uid).first()
            result_list.append({
                'id': video.id,
                'submitTime': video.submit_time,
                'title': video.title,
                'preview': video.cover,
                'uploaderAccount': user.account,
                'uploaderNickname': user.nickname,
            })
        db.close()
        return success({ 'total': total, 'dataList': result_list })
    except Exception as e:
        db.rollback()
        print(e.args)
        return error()

@router.post('/common/search')
def common_search(data: CommonSearch):
    db = SessionLocal()
    try:
        keywords = [kw.strip() for kw in data.content.split() if kw.strip()]
        if not keywords:
            return success({ 'total': 0, 'dataList': [] })
        conditions = []
        for keyword in keywords:
            search_term = f"%{keyword}%"
            conditions.append(Article.title.ilike(search_term))
            conditions.append(Article.content.ilike(search_term))
        articles = db.query(
                            Article.id,
                            Article.uid,
                            Article.submit_time,
                            Article.title,
                            Article.preview,
                            literal(None).label('cover'),
                            literal(0).label('type'),
                        ).filter(Article.status == 1, or_(*conditions))
        conditions = []
        for keyword in keywords:
            search_term = f"%{keyword}%"
            conditions.append(Video.title.ilike(search_term))
        videos = db.query(
                            Video.id,
                            Video.uid,
                            Video.submit_time,
                            Video.title,
                            literal(None).label('preview'),
                            Video.cover,
                            literal(1).label('type'),
                        ).filter(Video.status == 1, or_(*conditions))
        combined = articles.union_all(videos).order_by(desc(Article.submit_time))
        total = db.execute(db.query(func.count()).select_from(combined.subquery())).scalar()
        result = combined.limit(data.pageSize).offset((data.pageNum - 1) * data.pageSize).all()
        result_list = []
        for obj in result:
            user = db.query(User).filter(User.uid == obj.uid).first()
            result_list.append({
                'id': obj.id,
                'submitTime': obj.submit_time,
                'title': obj.title,
                'preview': obj.preview or obj.cover,
                'type': obj.type,
                'uploaderAccount': user.account,
                'uploaderNickname': user.nickname,
            })
        db.close()
        return success({'total': total, 'dataList': result_list })
    except Exception as e:
        db.rollback()
        print(e.args)
        return error()

@router.post('/user/getFollowed')
def user_get_followed(data: CommonList, token: str = Header(None)):
    db = SessionLocal()
    try:
        uid = verify_token(token)
        if not uid:
            return error('NOT_LOGIN')
        follows = db.query(Follow).filter(Follow.follower_id == uid)
        total = db.execute(db.query(func.count()).select_from(follows.subquery())).scalar()
        result = follows.limit(data.pageSize).offset((data.pageNum - 1) * data.pageSize).all()
        result_list = []
        for follow in result:
            user = db.query(User).filter(User.uid == follow.uid).first()
            result_list.append({
                'uid': user.uid,
                'account': user.account,
                'sex': user.sex,
                'nickname': user.nickname,
                'avatar': user.avatar,
                'desc': user.desc,
                'exp': user.exp,
            })
        db.close()
        return success({ 'total': total, 'dataList': result_list })
    except Exception as e:
        db.rollback()
        print(e.args)
        return error()

@router.post('/user/getFollowedSubmission')
def user_get_followed_submission(data: CommonList, token: str = Header(None)):
    db = SessionLocal()
    try:
        uid = verify_token(token)
        if not uid:
            return error('NOT_LOGIN')
        follows = db.query(Follow.uid).filter(Follow.follower_id == uid)
        articles = db.query(
                            Article.id,
                            Article.uid,
                            Article.submit_time,
                            Article.title,
                            Article.preview,
                            literal(None).label('cover'),
                            literal(0).label('type'),
                        ).filter(Article.status == 1, Article.uid.in_(follows))
        videos = db.query(
                            Video.id,
                            Video.uid,
                            Video.submit_time,
                            Video.title,
                            literal(None).label('preview'),
                            Video.cover,
                            literal(1).label('type'),
                        ).filter(Video.status == 1, Video.uid.in_(follows))
        combined = articles.union_all(videos).order_by(desc(Article.submit_time))
        total = db.execute(db.query(func.count()).select_from(combined.subquery())).scalar()
        result = combined.limit(data.pageSize).offset((data.pageNum - 1) * data.pageSize).all()
        result_list = []
        for obj in result:
            user = db.query(User).filter(User.uid == obj.uid).first()
            result_list.append({
                'id': obj.id,
                'submitTime': obj.submit_time,
                'title': obj.title,
                'preview': obj.preview or obj.cover,
                'type': obj.type,
                'uploaderAccount': user.account,
                'uploaderNickname': user.nickname,
            })
        db.close()
        return success({ 'total': total, 'dataList': result_list })
    except Exception as e:
        db.rollback()
        print(e.args)
        return error()

@router.post('/user/isAdmin')
def user_is_admin(token: str = Header(token)):
    db = SessionLocal()
    try:
        uid = verify_token(token)
        if not uid:
            return error('NOT_LOGIN')
        admin = db.query(User.admin).filter(User.uid == uid).first().admin
        db.close()
        return success({ 'isAdmin': admin })
    except Exception as e:
        db.rollback()
        print(e.args)
        return error()

@router.post('/user/getSubmissionNeedReview')
def user_get_submission_need_review(data: CommonList, token: str = Header(token)):
    db = SessionLocal()
    try:
        uid = verify_token(token)
        if not uid:
            return error('NOT_LOGIN')
        admin = db.query(User.admin).filter(User.uid == uid).first().admin
        if not admin:
            return error('NO_PERMISSION')
        articles = db.query(
                            Article.id,
                            Article.submit_time,
                            Article.title,
                            Article.content,
                            Article.preview,
                            literal(None).label('cover'),
                            literal(None).label('video'),
                            Article.status,
                            Article.desc,
                        ).filter((Article.status == 0) | (Article.status == 3))
        videos = db.query(
                            Video.id,
                            Video.submit_time,
                            Video.title,
                            literal(None).label('content'),
                            literal(None).label('preview'),
                            Video.cover,
                            Video.video,
                            Video.status,
                            Video.desc,
                        ).filter((Video.status == 0) | (Video.status == 3))
        combined = articles.union_all(videos).order_by(desc(Article.submit_time))
        total = db.execute(db.query(func.count()).select_from(combined.subquery())).scalar()
        result = combined.limit(data.pageSize).offset((data.pageNum - 1) * data.pageSize).all()
        db.close()
        return success({
            'total': total,
            'dataList': list(map(lambda obj: {
                    'id': obj.id,
                    'submitTime': obj.submit_time,
                    'title': obj.title,
                    'content': obj.content,
                    'preview': obj.preview,
                    'cover': obj.cover,
                    'video': obj.video,
                    'status': obj.status,
                    'desc': obj.desc,
                }, result)),
        })
    except Exception as e:
        db.rollback()
        print(e.args)
        return error()