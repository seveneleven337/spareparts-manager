
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.models.employee import Employee
from app.schemas.employee import (
    EmployeeCreate,
    EmployeeListResponse,
    EmployeeResponse,
    EmployeeUpdate,
)


router = APIRouter(prefix="/employees", tags=["Employees"])


@router.post(
    "",
    response_model=EmployeeResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_employee(
    data: EmployeeCreate,
    db: Session = Depends(get_db),
) -> Employee:
    employee = Employee(**data.model_dump())
    db.add(employee)

    try:
        db.commit()
        db.refresh(employee)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An employee with this email already exists.",
        ) from None

    return employee


@router.get("", response_model=EmployeeListResponse)
def list_employees(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> dict:
    total = db.scalar(
        select(func.count()).select_from(Employee)
    ) or 0

    statement = (
        select(Employee)
        .order_by(Employee.name.asc(), Employee.id.asc())
        .offset(offset)
        .limit(limit)
    )

    employees = db.scalars(statement).all()

    return {
        "items": employees,
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@router.get("/search", response_model=EmployeeListResponse)
def search_employees(
    name: str = Query(min_length=1, max_length=150),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> dict:
    name = name.strip()

    if not name:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Search name cannot be empty.",
        )

    filters = Employee.name.ilike(f"%{name}%")

    total = db.scalar(
        select(func.count())
        .select_from(Employee)
        .where(filters)
    ) or 0

    statement = (
        select(Employee)
        .where(filters)
        .order_by(Employee.name.asc(), Employee.id.asc())
        .offset(offset)
        .limit(limit)
    )

    employees = db.scalars(statement).all()

    return {
        "items": employees,
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@router.get("/{employee_id}", response_model=EmployeeResponse)
def get_employee(
    employee_id: int,
    db: Session = Depends(get_db),
) -> Employee:
    employee = db.get(Employee, employee_id)

    if employee is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found.",
        )

    return employee


@router.patch("/{employee_id}", response_model=EmployeeResponse)
def update_employee(
    employee_id: int,
    data: EmployeeUpdate,
    db: Session = Depends(get_db),
) -> Employee:
    employee = db.get(Employee, employee_id)

    if employee is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found.",
        )

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(employee, field, value)

    try:
        db.commit()
        db.refresh(employee)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An employee with this email already exists.",
        ) from None

    return employee


@router.delete(
    "/{employee_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_employee(
    employee_id: int,
    db: Session = Depends(get_db),
) -> Response:
    employee = db.get(Employee, employee_id)

    if employee is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found.",
        )

    db.delete(employee)
    db.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)
