import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from backend.config import settings

logger = logging.getLogger("Database-Init")

db_url = settings.DATABASE_URL

# Neon PostgreSQL requires SSL connections
if db_url and db_url.startswith("postgresql"):
    if "sslmode" not in db_url:
        if "?" in db_url:
            db_url += "&sslmode=require"
        else:
            db_url += "?sslmode=require"
    logger.info("Configured Neon PostgreSQL connection with sslmode=require")
else:
    logger.info("Configured SQLite fallback database")

# Create engine with production‑ready pooling
engine = create_engine(
    db_url,
    connect_args={"check_same_thread": False} if db_url.startswith("sqlite") else {},
    pool_pre_ping=True,  # Test connections before using them
    pool_size=10,        # Default pool size
    max_overflow=20      # Max additional connections beyond pool_size
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
