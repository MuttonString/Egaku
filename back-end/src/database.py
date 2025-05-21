from sqlalchemy import create_engine, TypeDecorator, DATETIME, BIGINT
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timezone

DATABASE_URL = "mysql+pymysql://root:123456@localhost:3306/egaku?charset=utf8mb4"
POOL_SIZE = 20

engine = create_engine(DATABASE_URL, pool_size=POOL_SIZE)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class TimestampDateTime(TypeDecorator):
    ''' 将数据库的DATETIME类型与时间戳相互转换 '''
    impl = DATETIME
    cache_ok = True

    def process_bind_param(self, value, dialect):
        return datetime.utcfromtimestamp(value / 1000)

    def process_result_value(self, value, dialect):
        return int(value.replace(tzinfo=timezone.utc).timestamp() * 1000) if value else None
    
class BigIntStr(TypeDecorator):
    ''' 将数据库的BIGINT转换为字符串 '''
    impl = BIGINT
    cache_ok = True

    def process_result_value(self, value, dialect):
        return str(value)