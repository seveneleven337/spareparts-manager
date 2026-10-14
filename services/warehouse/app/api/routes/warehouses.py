
from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, HTTPException, Query, Response, status
from pymongo import ReturnDocument
from pymongo.collection import Collection
from pymongo.errors import PyMongoError

from app.database import database
from app.schemas.warehouse import (
    WarehouseCreate,
    WarehouseListResponse,
    WarehouseResponse,
    WarehouseUpdate,
)


router = APIRouter(prefix="/warehouses", tags=["Warehouses"])

warehouses: Collection = database["warehouses"]


def serialize_warehouse(document: dict) -> dict:
    """Convert MongoDB fields into API response fields."""

    return {
        "id": str(document["_id"]),
        "name": document["name"],
        "location": document["location"],
        "description": document.get("description"),
        "created_at": document["created_at"],
        "updated_at": document["updated_at"],
    }


def get_warehouse_or_404(warehouse_id: str) -> dict:
    """Retrieve a warehouse or raise a 404 error."""

    if not ObjectId.is_valid(warehouse_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid warehouse ID.",
        )

    document = warehouses.find_one({"_id": ObjectId(warehouse_id)})

    if document is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Warehouse not found.",
        )

    return document


@router.post(
    "",
    response_model=WarehouseResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_warehouse(data: WarehouseCreate) -> dict:
    now = datetime.now(timezone.utc)

    document = data.model_dump()
    document["created_at"] = now
    document["updated_at"] = now

    result = warehouses.insert_one(document)
    created = warehouses.find_one({"_id": result.inserted_id})

    return serialize_warehouse(created)


@router.get("", response_model=WarehouseListResponse)
def list_warehouses(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> dict:
    total = warehouses.count_documents({})

    cursor = (
        warehouses.find()
        .sort([("name", 1), ("_id", 1)])
        .skip(offset)
        .limit(limit)
    )

    return {
        "items": [serialize_warehouse(item) for item in cursor],
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@router.get("/search", response_model=WarehouseListResponse)
def search_warehouses(
    name: str = Query(min_length=1, max_length=150),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> dict:
    name = name.strip()

    if not name:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Search name cannot be empty.",
        )

    filters = {"name": {"$regex": name, "$options": "i"}}
    total = warehouses.count_documents(filters)

    cursor = (
        warehouses.find(filters)
        .sort([("name", 1), ("_id", 1)])
        .skip(offset)
        .limit(limit)
    )

    return {
        "items": [serialize_warehouse(item) for item in cursor],
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@router.get("/{warehouse_id}", response_model=WarehouseResponse)
def get_warehouse(warehouse_id: str) -> dict:
    return serialize_warehouse(get_warehouse_or_404(warehouse_id))


@router.patch("/{warehouse_id}", response_model=WarehouseResponse)
def update_warehouse(
    warehouse_id: str,
    data: WarehouseUpdate,
) -> dict:
    get_warehouse_or_404(warehouse_id)

    update_data = data.model_dump(exclude_unset=True)
    update_data["updated_at"] = datetime.now(timezone.utc)

    try:
        updated = warehouses.find_one_and_update(
            {"_id": ObjectId(warehouse_id)},
            {"$set": update_data},
            return_document=ReturnDocument.AFTER,
        )
    except PyMongoError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Could not update warehouse.",
        ) from None

    if updated is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Warehouse not found.",
        )

    return serialize_warehouse(updated)


@router.delete(
    "/{warehouse_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_warehouse(warehouse_id: str) -> Response:
    get_warehouse_or_404(warehouse_id)

    result = warehouses.delete_one({"_id": ObjectId(warehouse_id)})

    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Warehouse not found.",
        )

    return Response(status_code=status.HTTP_204_NO_CONTENT)
