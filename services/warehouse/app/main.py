from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from pymongo.errors import PyMongoError

from app.api.routes.warehouses import router as warehouses_router
from app.database import check_database_connection, client
from app.seeds.warehouse_seed import initialize_warehouse_seeds


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize seed data and release the MongoDB client on shutdown."""

    try:
        check_database_connection()
        initialize_warehouse_seeds()

        yield
    finally:
        client.close()


app = FastAPI(
    title="Warehouse Service",
    description="Manages warehouse data using MongoDB.",
    version="0.2.0",
    lifespan=lifespan,
)

app.include_router(warehouses_router)


@app.get("/", tags=["Root"])
def root() -> dict[str, str]:
    return {
        "service": "warehouse-service",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
def health_check() -> dict[str, str]:
    return {
        "service": "warehouse-service",
        "status": "healthy",
    }


@app.get("/health/database", tags=["Health"])
def database_health_check():
    try:
        check_database_connection()

        return {
            "service": "warehouse-service",
            "database": "mongodb",
            "status": "connected",
        }

    except PyMongoError:
        return JSONResponse(
            status_code=503,
            content={
                "service": "warehouse-service",
                "database": "mongodb",
                "status": "unavailable",
            },
        )