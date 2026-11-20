
from typing import Literal

from pydantic import BaseModel, Field


class IncidentCreate(BaseModel):
    source_id: str = Field(min_length=1)
    title: str = Field(min_length=1, max_length=200)

    description: str | None = None

    severity: Literal[
        "LOW",
        "MEDIUM",
        "HIGH",
        "CRITICAL"
    ]

    probable_cause: str | None = None
    recommendation: str | None = None

    confidence: float | None = Field(
        default=None,
        ge=0,
        le=1
    )


class IncidentStatusUpdate(BaseModel):
    status: Literal[
        "open",
        "acknowledged",
        "resolved"
    ]
