from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.employee import Employee


EMPLOYEE_SEED_DATA = [
    {
        "name": "Alex Johnson",
        "email": "alex.johnson@example.com",
        "position": "Warehouse Manager",
    },
    {
        "name": "Maria Garcia",
        "email": "maria.garcia@example.com",
        "position": "Inventory Specialist",
    },
    {
        "name": "James Wilson",
        "email": "james.wilson@example.com",
        "position": "Warehouse Operator",
    },
    {
        "name": "Sofia Martinez",
        "email": "sofia.martinez@example.com",
        "position": "Procurement Specialist",
    },
    {
        "name": "Daniel Brown",
        "email": "daniel.brown@example.com",
        "position": "Logistics Coordinator",
    },
    {
        "name": "Emma Davis",
        "email": "emma.davis@example.com",
        "position": "Inventory Analyst",
    },
    {
        "name": "Lucas Miller",
        "email": "lucas.miller@example.com",
        "position": "Maintenance Technician",
    },
    {
        "name": "Olivia Taylor",
        "email": "olivia.taylor@example.com",
        "position": "Purchasing Assistant",
    },
    {
        "name": "Noah Anderson",
        "email": "noah.anderson@example.com",
        "position": "Warehouse Operator",
    },
    {
        "name": "Isabella Thomas",
        "email": "isabella.thomas@example.com",
        "position": "Operations Coordinator",
    },
]


def seed_employees(db: Session) -> bool:
    """Insert initial employees only when the employees table is empty."""

    existing_employee = db.query(Employee.id).first()

    if existing_employee is not None:
        return False

    employees = [
        Employee(**employee_data)
        for employee_data in EMPLOYEE_SEED_DATA
    ]

    try:
        db.add_all(employees)
        db.commit()
        return True
    except Exception:
        db.rollback()
        raise


def initialize_employee_seeds() -> None:
    """Initialize employee seed data using an independent database session."""

    db = SessionLocal()

    try:
        seeded = seed_employees(db)

        if seeded:
            print(
                f"Employee seed: inserted {len(EMPLOYEE_SEED_DATA)} employees."
            )
        else:
            print(
                "Employee seed: employees already exist; skipping seed."
            )
    finally:
        db.close()