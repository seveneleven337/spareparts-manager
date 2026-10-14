from alembic import op
import sqlalchemy as sa


revision = "0001_create_parts_table"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "parts",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "stock_quantity",
            sa.Integer(),
            server_default="0",
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.CheckConstraint(
            "stock_quantity >= 0",
            name="ck_parts_stock_quantity_nonnegative",
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        "ix_parts_name",
        "parts",
        ["name"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_parts_name", table_name="parts")
    op.drop_table("parts")