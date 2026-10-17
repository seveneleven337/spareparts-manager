from datetime import datetime, timezone

from app.database import database


WAREHOUSE_SEED_DATA = [
    {
        "name": "Helsinki Central Warehouse",
        "location": "Helsinki, Finland",
        "description": "Main distribution warehouse for spare parts in southern Finland.",
    },
    {
        "name": "Espoo Technical Warehouse",
        "location": "Espoo, Finland",
        "description": "Storage for technical components and maintenance equipment.",
    },
    {
        "name": "Tampere Distribution Center",
        "location": "Tampere, Finland",
        "description": "Regional distribution center serving central Finland.",
    },
    {
        "name": "Turku Logistics Warehouse",
        "location": "Turku, Finland",
        "description": "Warehouse supporting logistics and deliveries in western Finland.",
    },
    {
        "name": "Oulu Spare Parts Depot",
        "location": "Oulu, Finland",
        "description": "Regional depot for spare parts and replacement components in northern Finland.",
    },
    {
        "name": "Lahti Maintenance Storage",
        "location": "Lahti, Finland",
        "description": "Storage facility for maintenance supplies and workshop equipment.",
    },
    {
        "name": "Jyväskylä Regional Warehouse",
        "location": "Jyväskylä, Finland",
        "description": "Regional inventory storage for equipment and spare parts.",
    },
    {
        "name": "Kuopio Parts Center",
        "location": "Kuopio, Finland",
        "description": "Distribution point for spare parts serving eastern Finland.",
    },
    {
        "name": "Vaasa Industrial Warehouse",
        "location": "Vaasa, Finland",
        "description": "Storage for industrial components and replacement equipment.",
    },
    {
        "name": "Rovaniemi Northern Depot",
        "location": "Rovaniemi, Finland",
        "description": "Northern depot for spare parts and operational supplies.",
    },
]


def initialize_warehouse_seeds() -> None:
    """Insert initial warehouses only when the collection is empty."""

    warehouses = database["warehouses"]

    if warehouses.count_documents({}, limit=1) > 0:
        print("Warehouse seed: warehouses already exist; skipping seed.")
        return

    now = datetime.now(timezone.utc)

    documents = [
        {
            **warehouse_data,
            "created_at": now,
            "updated_at": now,
        }
        for warehouse_data in WAREHOUSE_SEED_DATA
    ]

    result = warehouses.insert_many(documents)

    print(
        f"Warehouse seed: inserted {len(result.inserted_ids)} warehouses."
    )