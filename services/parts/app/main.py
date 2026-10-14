
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.database import engine


app = FastAPI(
    title="Parts Service",
    description="Manages spare parts and inventory data.",
    version="0.1.0",
)


@app.get("/", tags=["Root"])
def root() -> dict[str, str]:
    return {
        "service": "parts-service",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
def health_check() -> dict[str, str]:
    return {
        "service": "parts-service",
        "status": "healthy",
    }


@app.get("/health/database", tags=["Health"])
def database_health_check():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "service": "parts-service",
            "database": "postgresql",
            "status": "connected",
        }

    except SQLAlchemyError:
        return JSONResponse(
            status_code=503,
            content={
                "service": "parts-service",
                "database": "postgresql",
                "status": "unavailable",
            },
        )
