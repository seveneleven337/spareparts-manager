from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.schemas.part_model import Part


PART_SEED_DATA = [
    {
        "name": "Hydraulic Pump",
        "description": "Hydraulic pump for industrial machinery.",
        "stock_quantity": 12,
    },
    {
        "name": "Ball Bearing 6204",
        "description": "Standard deep-groove ball bearing for rotating equipment.",
        "stock_quantity": 150,
    },
    {
        "name": "Drive Belt A-42",
        "description": "Replacement V-belt for industrial drive systems.",
        "stock_quantity": 35,
    },
    {
        "name": "Air Filter AF-100",
        "description": "Replacement air filter for industrial equipment.",
        "stock_quantity": 48,
    },
    {
        "name": "Electric Motor 1.5 kW",
        "description": "Three-phase electric motor for machinery.",
        "stock_quantity": 8,
    },
    {
        "name": "Pressure Sensor PS-200",
        "description": "Industrial pressure sensor for monitoring hydraulic systems.",
        "stock_quantity": 20,
    },
    {
        "name": "Solenoid Valve SV-24",
        "description": "24V solenoid valve for automated fluid control.",
        "stock_quantity": 16,
    },
    {
        "name": "Lubrication Filter LF-50",
        "description": "Replacement filter for industrial lubrication systems.",
        "stock_quantity": 42,
    },
    {
        "name": "Coupling Insert CI-30",
        "description": "Flexible coupling insert for connecting drive shafts.",
        "stock_quantity": 25,
    },
    {
        "name": "Emergency Stop Switch ES-01",
        "description": "Replacement emergency stop switch for machinery control panels.",
        "stock_quantity": 10,
    },
]


def seed_parts(db: Session) -> bool:
    """Insert initial parts only when the parts table is empty."""

    existing_part = db.scalar(select(Part.id).limit(1))

    if existing_part is not None:
        return False

    db.add_all([Part(**part_data) for part_data in PART_SEED_DATA])
    db.commit()

    return True


def initialize_part_seeds() -> None:
    """Initialize seed data using an independent database session."""

    db = SessionLocal()

    try:
        seeded = seed_parts(db)

        if seeded:
            print(f"Parts seed: inserted {len(PART_SEED_DATA)} parts.")
        else:
            print("Parts seed: parts already exist; skipping seed.")

    except Exception:
        db.rollback()
        raise
    finally:
        db.close()