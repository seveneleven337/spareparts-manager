
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class WarehouseCreate(BaseModel):
    """Fields required to create a warehouse."""

    name: str = Field(min_length=1, max_length=150)
    location: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=1000)

    @field_validator("name", "location")
    @classmethod
    def validate_required_text(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError("This field cannot be empty.")

        return value

    @field_validator("description")
    @classmethod
    def validate_description(cls, value: str | None) -> str | None:
        if value is not None:
            value = value.strip()

            if not value:
                return None

        return value


class WarehouseUpdate(BaseModel):
    """Fields that can be updated on an existing warehouse."""

    name: str | None = Field(default=None, min_length=1, max_length=150)
    location: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=1000)

    @field_validator("name", "location")
    @classmethod
    def validate_required_text(cls, value: str | None) -> str | None:
        if value is None:
            return None

        value = value.strip()

        if not value:
            raise ValueError("This field cannot be empty.")

        return value

    @field_validator("description")
    @classmethod
    def validate_description(cls, value: str | None) -> str | None:
        if value is not None:
            value = value.strip()

            if not value:
                return None

        return value

    @model_validator(mode="after")
    def validate_update(self):
        if not self.model_fields_set:
            raise ValueError("At least one field must be provided.")

        for field in ("name", "location"):
            if field in self.model_fields_set and getattr(self, field) is None:
                raise ValueError(f"{field} cannot be null.")

        return self


class WarehouseResponse(BaseModel):
    """Warehouse representation returned by the API."""

    model_config = ConfigDict(extra="ignore")

    id: str
    name: str
    location: str
    description: str | None = None
    created_at: datetime
    updated_at: datetime


class WarehouseListResponse(BaseModel):
    """Paginated list of warehouses."""

    items: list[WarehouseResponse]
    total: int
    limit: int
    offset: int
