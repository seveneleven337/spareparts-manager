
import os

from pymongo import MongoClient
from pymongo.database import Database


MONGO_HOST = os.getenv("MONGO_HOST", "localhost")
MONGO_PORT = int(os.getenv("MONGO_PORT", "27017"))
MONGO_DATABASE = os.getenv(
    "MONGO_DATABASE",
    "spareparts_warehouse",
)

client = MongoClient(
    host=MONGO_HOST,
    port=MONGO_PORT,
    serverSelectionTimeoutMS=3000,
    connectTimeoutMS=3000,
)

database: Database = client[MONGO_DATABASE]


def check_database_connection() -> bool:
    """Verify that MongoDB is reachable."""

    client.admin.command("ping")
    return True
