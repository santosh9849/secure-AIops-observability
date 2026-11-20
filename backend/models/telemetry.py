from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class Metrics(BaseModel):
    cpu: float = Field(ge=0, le=100)
    memory: float = Field(ge=0, le=100)
    disk: float = Field(ge=0, le=100)
    network_latency: float = Field(ge=0)


class Telemetry(BaseModel):
    payload_id: str = Field(min_length=1)
    collector_id: str = Field(min_length=1)
    timestamp: datetime
    source_timezone: str = Field(min_length=1)
    source_id: str = Field(min_length=1)

    metrics: Metrics

    health_status: str = Field(min_length=1)

    events: list[dict[str, Any]] = Field(default_factory=list)