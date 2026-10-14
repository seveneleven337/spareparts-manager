
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    Response,
    status,
)
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.schemas.part import (
    PartCreate,
    PartListResponse,
    PartResponse,
    PartUpdate,
)
from app.schemas.part_model import Part


router = APIRouter(
    prefix="/parts",
    tags=["Parts"],
)


@router.post(
    "",
    response_model=PartResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_part(
    part_data: PartCreate,
    db: Session = Depends(get_db),
) -> Part:
    """Create a spare part."""

    part = Part(**part_data.model_dump())

    db.add(part)
    db.commit()
    db.refresh(part)

    return part


@router.get(
    "",
    response_model=PartListResponse,
)
def get_parts(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> PartListResponse:
    """List spare parts with pagination."""

    total = db.scalar(
        select(func.count()).select_from(Part)
    ) or 0

    statement = (
        select(Part)
        .order_by(Part.id)
        .limit(limit)
        .offset(offset)
    )

    items = list(db.scalars(statement).all())

    return PartListResponse(
        items=items,
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/search",
    response_model=PartListResponse,
)
def search_parts_by_name(
    name: str = Query(min_length=1, max_length=150),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> PartListResponse:
    """Search spare parts by a case-insensitive name match."""

    search_name = name.strip()

    if not search_name:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Search name cannot be empty.",
        )

    search_pattern = f"%{search_name}%"
    filters = Part.name.ilike(search_pattern)

    total = db.scalar(
        select(func.count())
        .select_from(Part)
        .where(filters)
    ) or 0

    statement = (
        select(Part)
        .where(filters)
        .order_by(Part.name, Part.id)
        .limit(limit)
        .offset(offset)
    )

    items = list(db.scalars(statement).all())

    return PartListResponse(
        items=items,
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/{part_id}",
    response_model=PartResponse,
)
def get_part(
    part_id: int,
    db: Session = Depends(get_db),
) -> Part:
    """Retrieve a spare part by ID."""

    part = db.get(Part, part_id)

    if part is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Part not found.",
        )

    return part


@router.patch(
    "/{part_id}",
    response_model=PartResponse,
)
def update_part(
    part_id: int,
    part_data: PartUpdate,
    db: Session = Depends(get_db),
) -> Part:
    """Update the supplied fields of an existing spare part."""

    part = db.get(Part, part_id)

    if part is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Part not found.",
        )

    update_data = part_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(part, field, value)

    db.commit()
    db.refresh(part)

    return part


@router.delete(
    "/{part_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_part(
    part_id: int,
    db: Session = Depends(get_db),
) -> Response:
    """Delete a spare part permanently."""

    part = db.get(Part, part_id)

    if part is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Part not found.",
        )

    db.delete(part)
    db.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)
