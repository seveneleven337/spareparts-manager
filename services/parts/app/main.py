from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.api.routes.parts import router as parts_router
from app.database import engine
from app.seeds.part_seed import initialize_part_seeds


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize seed data and release database resources on shutdown."""

    try:
        initialize_part_seeds()
        yield
    finally:
        engine.dispose()


app = FastAPI(
    title="Parts Service",
    description="Manages spare parts and inventory data.",
    version="0.2.0",
    lifespan=lifespan,
)

app.include_router(parts_router)


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