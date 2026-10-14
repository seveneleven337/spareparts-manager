
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

from app.api.routes.employees import router as employees_router
from app.database import Base, check_database_connection, engine
from app.models.employee import Employee  # noqa: F401


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize the schema and release connections on shutdown."""

    Base.metadata.create_all(bind=engine)

    try:
        yield
    finally:
        engine.dispose()


app = FastAPI(
    title="Employee Service",
    description="Manages employee data using MariaDB.",
    version="0.2.0",
    lifespan=lifespan,
)

app.include_router(employees_router)


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
