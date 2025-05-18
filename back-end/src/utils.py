from datetime import datetime
from .database import db
from .models import Config, Token
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

def error(msg='Server error'):
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
    config = db.query(Config).first()
    db.close()
    SMTP_SERVER = config.smtp_server
    SMTP_PORT = config.smtp_port
    SENDER_EMAIL = config.sender_email
    SENDER_PASSWORD = config.sender_password

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
    token_obj = db.query(Token).filter(Token.token == token).order_by(Token.expire_time.desc()).first()
    if token_obj:
        if token_obj.expire_time < time():
            db.close()
            return False
        token_obj.expire_time = time() + 24 * 60 * 60 * 1000
        uid = token_obj.uid
        db.commit()
        db.close()
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