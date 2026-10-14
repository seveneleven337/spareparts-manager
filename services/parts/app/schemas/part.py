
from datetime import datetime

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
    model_validator,
)


class PartCreate(BaseModel):
    """Fields required to create a part."""

    name: str = Field(min_length=1, max_length=150)
    description: str | None = None
    stock_quantity: int = Field(default=0, ge=0)

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError("Part name cannot be empty.")

        return value


class PartUpdate(BaseModel):
    """Fields that can be updated on an existing part."""

    name: str | None = Field(
        default=None,
        min_length=1,
        max_length=150,
    )
    description: str | None = None
    stock_quantity: int | None = Field(default=None, ge=0)

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str | None) -> str | None:
        if value is None:
            return value

        value = value.strip()

        if not value:
            raise ValueError("Part name cannot be empty.")

        return value

    @model_validator(mode="after")
    def validate_update(self):
        if not self.model_fields_set:
            raise ValueError("At least one field must be provided.")

        if "name" in self.model_fields_set and self.name is None:
            raise ValueError("Part name cannot be null.")

        if (
            "stock_quantity" in self.model_fields_set
            and self.stock_quantity is None
        ):
            raise ValueError("Stock quantity cannot be null.")

        return self


class PartResponse(BaseModel):
    """Part representation returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str | None
    stock_quantity: int
    created_at: datetime
    updated_at: datetime


class PartListResponse(BaseModel):
    """Paginated response containing spare parts."""

    items: list[PartResponse]
    total: int
    limit: int
    offset: int
