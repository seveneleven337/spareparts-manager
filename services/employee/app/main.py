
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

from app.database import check_database_connection, engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Release database connections when the service stops."""

    yield
    engine.dispose()


app = FastAPI(
    title="Employee Service",
    description="Manages employee data using MariaDB.",
    version="0.1.0",
    lifespan=lifespan,
)


@app.get("/", tags=["Root"])
def root() -> dict[str, str]:
    return {
        "service": "employee-service",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
def health_check() -> dict[str, str]:
    return {
        "service": "employee-service",
        "status": "healthy",
    }


@app.get("/health/database", tags=["Health"])
def database_health_check():
    try:
        check_database_connection()

        return {
            "service": "employee-service",
            "database": "mariadb",
            "status": "connected",
        }

    except SQLAlchemyError:
        return JSONResponse(
            status_code=503,
            content={
                "service": "employee-service",
                "database": "mariadb",
                "status": "unavailable",
            },
        )
