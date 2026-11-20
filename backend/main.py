import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Any

from fastapi import Depends, FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

from backend import database

# Shared secret the collector must send. Override with an environment variable later.
API_KEY = os.getenv("COLLECTOR_API_KEY", "dev-key-change-me")


@asynccontextmanager
async def lifespan(app: FastAPI):
    database.init_db()  # runs once when the server starts
    yield


app = FastAPI(title="SENTINEL X Backend", lifespan=lifespan)


def verify_api_key(x_api_key: str | None = Header(default=None)):
    """Reject any request without the correct X-API-Key header."""
    if x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")


# ---- Data shapes (these mirror docs/api-contract.md) ----
class Metrics(BaseModel):
    cpu: float = Field(ge=0, le=100)
    memory: float = Field(ge=0, le=100)
    disk: float = Field(ge=0, le=100)
    network_latency: float = Field(ge=0)  # milliseconds


class Telemetry(BaseModel):
    payload_id: str
    collector_id: str
    timestamp: datetime  # "2026-11-20T09:30:00Z" is parsed automatically
    source_timezone: str
    source_id: str
    metrics: Metrics
    health_status: str
    events: list[dict[str, Any]] = []


# ---- Endpoints ----
@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/ingest", dependencies=[Depends(verify_api_key)])
def ingest(payload: Telemetry):
    ts = payload.timestamp
    if ts.tzinfo is None:                 # no timezone given -> assume UTC
        ts = ts.replace(tzinfo=timezone.utc)
    event_time = ts.astimezone(timezone.utc).isoformat()

    inserted = database.insert_payload(
        {
            "payload_id": payload.payload_id,
            "collector_id": payload.collector_id,
            "source_id": payload.source_id,
            "event_time": event_time,
            "received_at": datetime.now(timezone.utc).isoformat(),
            "source_timezone": payload.source_timezone,
            "cpu": payload.metrics.cpu,
            "memory": payload.metrics.memory,
            "disk": payload.metrics.disk,
            "network_latency": payload.metrics.network_latency,
            "health_status": payload.health_status,
            "events": payload.events,
        }
    )
    # A duplicate is NOT an error: the collector retried, we already have it.
    return {"status": "accepted" if inserted else "duplicate",
            "payload_id": payload.payload_id}


@app.get("/latest")
def latest():
    return database.get_latest_per_source()


@app.get("/history/{source_id}")
def history(source_id: str, limit: int = 100):
    return database.get_history(source_id, limit)


@app.get("/collectors")
def collectors():
    return database.get_collectors()
