
import os

from sqlalchemy import URL, create_engine, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker


DATABASE_URL = URL.create(
    drivername="mysql+pymysql",
    username=os.getenv("MARIADB_USER", "spareparts_user"),
    password=os.getenv("MARIADB_PASSWORD", ""),
    host=os.getenv("MARIADB_HOST", "localhost"),
    port=int(os.getenv("MARIADB_CONTAINER_PORT", "3306")),
    database=os.getenv("MARIADB_DATABASE", "spareparts_employees"),
    query={"charset": "utf8mb4"},
)

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600,
)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """Base class for SQLAlchemy models."""


def check_database_connection() -> bool:
    """Verify that MariaDB is reachable."""

    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))

    return True
