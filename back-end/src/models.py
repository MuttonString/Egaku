from sqlalchemy import Column, BIGINT, VARCHAR, INT, DATETIME, BOOLEAN
from .database import Base, TimestampDateTime, BigIntStr

class Config(Base):
    __tablename__ = 'config'
    smtp_server = Column(VARCHAR(255))
    smtp_port = Column(INT)
    sender_email = Column(VARCHAR(255), primary_key=True)
    sender_password = Column(VARCHAR(255))

class User(Base):
    __tablename__ = 'user'
    uid = Column(BigIntStr, primary_key=True, autoincrement=True, index=True, unique=True)
    account = Column(VARCHAR(16), nullable=False, index=True, unique=True)
    email = Column(VARCHAR(255), nullable=False, index=True, unique=True)
    password = Column(VARCHAR(512), nullable=False)
    sex = Column(INT)
    nickname = Column(VARCHAR(50))
    avator = Column(VARCHAR(255))
    desc = Column(VARCHAR(255))
    exp = Column(INT, nullable=False)
    signup_time = Column(TimestampDateTime, nullable=False)
    admin = Column(BOOLEAN)
    
class Token(Base):
    __tablename__ = 'token'
    id = Column(BigIntStr, primary_key=True, autoincrement=True, index=True, unique=True)
    token = Column(VARCHAR(255), nullable=False)
    expire_time = Column(TimestampDateTime, nullable=False)

class Verification(Base):
    __tablename__ = 'verification'
    id = Column(BigIntStr, primary_key=True, autoincrement=True, index=True, unique=True)
    email = Column(VARCHAR(255), nullable=False, index=True, unique=True)
    code = Column(VARCHAR(6), nullable=False)
    expire_time = Column(TimestampDateTime, nullable=False)