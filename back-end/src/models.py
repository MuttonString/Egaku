from sqlalchemy import Column, BIGINT, VARCHAR, INT, DATETIME, BOOLEAN, TEXT
from .database import Base, TimestampDateTime, BigIntStr


class Config(Base):
    __tablename__ = 'config'
    smtp_server = Column(VARCHAR(255))
    smtp_port = Column(INT)
    sender_email = Column(VARCHAR(255), primary_key=True)
    sender_password = Column(VARCHAR(255))
    api_key = Column(VARCHAR(255))
    secret_key = Column(VARCHAR(255))


class User(Base):
    __tablename__ = 'user'
    uid = Column(BigIntStr, primary_key=True,
                 autoincrement=True, index=True, unique=True)
    account = Column(VARCHAR(16), nullable=False, index=True, unique=True)
    email = Column(VARCHAR(255), nullable=False, index=True, unique=True)
    password = Column(VARCHAR(512), nullable=False)
    sex = Column(INT)
    nickname = Column(VARCHAR(50))
    avatar = Column(VARCHAR(255))
    desc = Column(VARCHAR(255))
    exp = Column(INT, nullable=False)
    signup_time = Column(TimestampDateTime, nullable=False)
    admin = Column(BOOLEAN)
    disable_reminder = Column(INT)
    remind_after = Column(TimestampDateTime)


class Token(Base):
    __tablename__ = 'token'
    id = Column(BigIntStr, primary_key=True,
                autoincrement=True, index=True, unique=True)
    uid = Column(BigIntStr, nullable=False)
    token = Column(VARCHAR(255), nullable=False)
    expire_time = Column(TimestampDateTime, nullable=False)


class Verification(Base):
    __tablename__ = 'verification'
    id = Column(BigIntStr, primary_key=True,
                autoincrement=True, index=True, unique=True)
    email = Column(VARCHAR(255), nullable=False)
    code = Column(VARCHAR(6), nullable=False)
    expire_time = Column(TimestampDateTime, nullable=False)


class UploadedFile(Base):
    __tablename__ = 'uploaded_file'
    id = Column(BigIntStr, primary_key=True,
                autoincrement=True, index=True, unique=True)
    url = Column(VARCHAR(512), nullable=False)
    filename = Column(VARCHAR(255), nullable=False)
    uid = Column(BigIntStr, nullable=False)
    upload_time = Column(TimestampDateTime, nullable=False)


class Article(Base):
    __tablename__ = 'article'
    id = Column(BigIntStr, primary_key=True,
                autoincrement=True, index=True, unique=True)
    uid = Column(BigIntStr, nullable=False)
    submit_time = Column(TimestampDateTime, nullable=False)
    title = Column(VARCHAR(50), nullable=False)
    content = Column(TEXT, nullable=False)
    preview = Column(VARCHAR(51), nullable=False)
    status = Column(INT, nullable=False)
    desc = Column(VARCHAR(255))


class Video(Base):
    __tablename__ = 'video'
    id = Column(BigIntStr, primary_key=True,
                autoincrement=True, index=True, unique=True)
    uid = Column(BigIntStr, nullable=False)
    submit_time = Column(TimestampDateTime, nullable=False)
    title = Column(VARCHAR(50), nullable=False)
    cover = Column(VARCHAR(255), nullable=False)
    video = Column(VARCHAR(255), nullable=False)
    status = Column(INT, nullable=False)
    desc = Column(VARCHAR(255))


class Collection(Base):
    __tablename__ = 'collection'
    id = Column(BigIntStr, primary_key=True,
                autoincrement=True, index=True, unique=True)
    uid = Column(BigIntStr, nullable=False)
    submission_id = Column(BigIntStr, nullable=False)
    type = Column(INT, nullable=False)
    time = Column(TimestampDateTime, nullable=False)


class Comment(Base):
    __tablename__ = 'comment'
    id = Column(BigIntStr, primary_key=True,
                autoincrement=True, index=True, unique=True)
    uid = Column(BigIntStr, nullable=False)
    content = Column(VARCHAR(255), nullable=False)
    time = Column(TimestampDateTime, nullable=False)
    submission_id = Column(BigIntStr, nullable=False)
    type = Column(INT, nullable=False)


class Follow(Base):
    __tablename__ = 'follow'
    id = Column(BigIntStr, primary_key=True,
                autoincrement=True, index=True, unique=True)
    uid = Column(BigIntStr, nullable=False)
    follower_id = Column(BigIntStr, nullable=False)
