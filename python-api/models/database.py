import os
from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Database configuration
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "performance_test")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "password")

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# SQLAlchemy setup with enhanced connection pool
engine = create_engine(
    DATABASE_URL,
    pool_size=20,        # จำนวน connections ที่เก็บไว้ใน pool
    max_overflow=30,     # จำนวน connections เพิ่มเติมที่สร้างได้เมื่อ pool เต็ม
    pool_timeout=60,     # เวลารอ connection ก่อน timeout (วินาที)
    pool_recycle=3600,   # เวลาที่ connection จะถูกสร้างใหม่ (1 ชั่วโมง)
    pool_pre_ping=True,  # ตรวจสอบ connection ก่อนใช้งาน
    echo=False           # ไม่ show SQL queries ใน logs
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() 