from datetime import datetime
from .database import SessionLocal
from .models import Config, Token, User, Article, Video
import hashlib
import secrets
import re
import smtplib
import random
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from fastapi import UploadFile, File
import uuid
import os

db = SessionLocal()
config = db.query(Config).first()
SMTP_SERVER = config.smtp_server
SMTP_PORT = config.smtp_port
SENDER_EMAIL = config.sender_email
SENDER_PASSWORD = config.sender_password
API_KEY = config.api_key
SECRET_KEY = config.secret_key
db.close()

def error(msg='SERVER_ERROR'):
    return { 'success': False, 'data': { 'error': msg } }

def success(data={}):
    return { 'success': True, 'data': data }

def time():
    return datetime.now().timestamp() * 1000

def hash_password(pwd: str, uid: str):
    sha512 = hashlib.sha512()
    sha512.update(f'{pwd}{uid}'.encode('utf-8'))
    return sha512.hexdigest()

def token():
    return secrets.token_hex(32)

def mask_email(email: str):
    masked = re.sub(r'(\w)(\w+)(\w)(?=@)',
                    lambda m: m.group(1) + '***' + m.group(3),
                    email)
    return masked

def generate_code():
    return ''.join(random.choice('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789') for _ in range(6))

def send_code(code: str, email: str, lang: str):
    server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
    server.login(SENDER_EMAIL, SENDER_PASSWORD)
    
    message = MIMEMultipart()
    message['From'] = 'Egaku@egaku.com'
    message['To'] = email
    if lang == 'zh-Hans':
        message['Subject'] = '验证码'
        message.attach(MIMEText(f'''
            <!DOCTYPE html>
            <html lang="zh-Hans">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Egaku</title>
            </head>
            <body>
                <h3>Egaku</h3>
                <p>您的验证码是：</p>
                <h1>{code}</h1>
                <p>有效时间为<b>5分钟</b>。请勿将其泄露给他人。如果您未进行过相关操作，请忽略。</p>
                <p>谢谢！</p>
            </body>
            </html>
        ''', 'html'))
    elif lang == 'zh-Hant':
        message['Subject'] = '驗證碼'
        message.attach(MIMEText(f'''
            <!DOCTYPE html>
            <html lang="zh-Hant">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Egaku</title>
            </head>
            <body>
                <h3>Egaku</h3>
                <p>您的驗證碼是：</p>
                <h1>{code}</h1>
                <p>有效時間為<b>5分鐘</b>。請勿將其洩露給他人。如果您未進行過相關操作，請忽略。</p>
                <p>謝謝！</p>
            </body>
            </html>
        ''', 'html'))
    elif lang == 'ja':
        message['Subject'] = '認証コード'
        message.attach(MIMEText(f'''
            <!DOCTYPE html>
            <html lang="ja">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Egaku</title>
            </head>
            <body>
                <h3>Egaku</h3>
                <p>あなたの認証コードは：</p>
                <h1>{code}</h1>
                <p>有効時間は<b>5分</b>です。他人に漏らさないでください。関連する操作を行ったことがない場合は、無視してください。</p>
                <p>ありがとうございます。</p>
            </body>
            </html>
        ''', 'html'))
    else:
        message['Subject'] = 'Verification Code'
        message.attach(MIMEText(f'''
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Egaku</title>
            </head>
            <body>
                <h3>Egaku</h3>
                <p>Your verification code is:</p>
                <h1>{code}</h1>
                <p>The effective time is <b>5 minutes</b>. Please do not disclose it to others. If you have not performed the relevant operation, please ignore it.</p>
                <p>Thanks!</p>
            </body>
            </html>
        ''', 'html'))

    server.sendmail(SENDER_EMAIL, email, message.as_string())
    server.quit()

def verify_token(token: str):
    db = SessionLocal()
    token_obj = db.query(Token).filter(Token.token == token).order_by(Token.expire_time.desc()).first()
    if token_obj:
        if token_obj.expire_time < time():
            db.close()
            return False
        token_obj.expire_time = time() + 60 * 60 * 1000
        uid = token_obj.uid
        db.commit()
        return uid
    db.close()
    return False

async def save_file(file: UploadFile = File(..., max_size=1024*1024*1024)):
    BASE_URL = 'http://localhost:8000'

    file_ext = file.filename.split('.')[-1]
    filename = f'{uuid.uuid4().hex}.{file_ext}'
    if not os.path.exists('uploads'):
        os.makedirs('uploads')
    file_path = os.path.join('uploads', filename)
    with open(file_path, 'wb') as buffer:
        while chunk := await file.read(1024 * 1024):
            buffer.write(chunk)
    return f'{BASE_URL}/files/{filename}'

def exp_plus(uid: str, exp: int):
    db = SessionLocal()
    user = db.query(User).filter(User.uid == uid).first()
    user.exp = user.exp + exp
    db.commit()

import json
import base64
from urllib.request import urlopen
from urllib.request import Request
from urllib.error import URLError
from urllib.parse import urlencode
from urllib.parse import quote_plus
import ssl
ssl._create_default_https_context = ssl._create_unverified_context
TEXT_CENSOR = 'https://aip.baidubce.com/rest/2.0/solution/v1/text_censor/v2/user_defined'
VIDEO_CENSOR = 'https://aip.baidubce.com/rest/2.0/solution/v1/video_censor/v1/video/submit'
def _fetch_review_token():
    TOKEN_URL = 'https://aip.baidubce.com/oauth/2.0/token'
    params = {
                'grant_type': 'client_credentials',
                'client_id': API_KEY,
                'client_secret': SECRET_KEY
            }
    post_data = urlencode(params).encode('utf-8')
    req = Request(TOKEN_URL, post_data)
    try:
        f = urlopen(req, timeout=5)
        result_str = f.read()
    except URLError as err:
        print(err)
    result_str = result_str.decode()
    result = json.loads(result_str)
    if ('access_token' in result.keys() and 'scope' in result.keys()):
        if not 'brain_all_scope' in result['scope'].split(' '):
            print ('please ensure has check the ability')
            return
        return result['access_token']
    else:
        print ('please overwrite the correct API_KEY and SECRET_KEY')
        return

def _request(url, data):
    req = Request(url, data.encode('utf-8'))
    try:
        f = urlopen(req)
        result_str = f.read().decode()
        return json.loads(result_str)
    except URLError as err:
        print(err)

def _read_file(path):
    f = None
    try:
        f = open(f'./uploads/{path}', 'rb')
        return f.read()
    except:
        print('read file fail')
        return None
    finally:
        if f:
            f.close()

_token = _fetch_review_token()
def review(content: str, type: int, id: str, uid: str):
    db = SessionLocal()
    if type == 0:
        text_url = TEXT_CENSOR + "?access_token=" + _token
        result = _request(text_url, urlencode({ 'text': content }))
        print(result)
        article = db.query(Article).filter(Article.id == id).first()
        if result['conclusion'] == '合规':
            article.status = 1
            db.commit()
            exp_plus(uid, 20)
        else:
            article.status = 2
            article.desc = '; '.join(list(map(lambda obj: obj['msg'], result['data'])))
            db.commit()
    elif type == 1:
        video_url = VIDEO_URL + "?access_token=" + _token
        # TODO 缺失存储视频的网络服务器，无法AI审核视频，暂时直接过审
        result = { 'conslusion': '合规' }
        print(result)
        video = db.query(Video).filter(Video.id == id).first()
        if result['conclusion'] == '合规':
            video.status = 1
            db.commit()
            exp_plus(uid, 20)
        else:
            video.status = 2
            video.desc = '; '.join(list(map(lambda obj: obj['msg'], result['data'])))
            db.commit()
    db.close()

import requests
NEWS_SUMMARY = 'https://aip.baidubce.com/rpc/2.0/nlp/v1/news_summary'
def summary(title: str, content: str):
    url = NEWS_SUMMARY + '?charset=UTF-8&access_token=' + _token
    result = requests.post(url, data=json.dumps({
        'title': title,
        'content': content,
        'max_summary_len': 200,
    }), headers={ 'Content-Type': 'application/json' }).json()
    print(result)
    return result['summary']