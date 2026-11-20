import os
from backend.services.ingestion import ingest_telemetry
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from backend import database
from backend.models.telemetry import Telemetry


# Collector authentication
API_KEY = os.getenv("COLLECTOR_API_KEY", "dev-key-change-me")


# Database initialization
@asynccontextmanager
async def lifespan(app: FastAPI):
    database.init_db()
    yield


# FastAPI application
app = FastAPI(
    title="SENTINEL X Backend",
    description="Secure AI-powered observability platform",
    version="1.0.0",
    lifespan=lifespan
)


# Frontend CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Collector API key verification
def verify_api_key(
    x_api_key: str | None = Header(default=None)
):
    if x_api_key != API_KEY:
        raise HTTPException(
            status_code=401,
            detail="Invalid or missing API key"
        )


# -------------------------------
# HEALTH CHECK
# -------------------------------

@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "SENTINEL X Backend"
    }


# -------------------------------
# TELEMETRY INGESTION
# -------------------------------

@app.post(
    "/ingest",
    dependencies=[Depends(verify_api_key)]
)
def ingest(payload: Telemetry):

    timestamp = payload.timestamp

    # Convert timestamp to UTC
    if timestamp.tzinfo is None:
        timestamp = timestamp.replace(tzinfo=timezone.utc)

    event_time = timestamp.astimezone(
        timezone.utc
    ).isoformat()

    # Store telemetry in SQLite
    inserted = database.insert_payload(
        {
            "payload_id": payload.payload_id,
            "collector_id": payload.collector_id,
            "source_id": payload.source_id,
            "event_time": event_time,
            "received_at": datetime.now(
                timezone.utc
            ).isoformat(),
            "source_timezone": payload.source_timezone,
            "cpu": payload.metrics.cpu,
            "memory": payload.metrics.memory,
            "disk": payload.metrics.disk,
            "network_latency": payload.metrics.network_latency,
            "health_status": payload.health_status,
            "events": payload.events,
        }
    )

    return {
        "status": "accepted" if inserted else "duplicate",
        "payload_id": payload.payload_id
    }


# -------------------------------
# LATEST TELEMETRY
# -------------------------------

@app.get("/latest")
def latest():
    return database.get_latest_per_source()


# -------------------------------
# TELEMETRY HISTORY
# -------------------------------

@app.get("/history/{source_id}")
def history(
    source_id: str,
    limit: int = 100
):
    if limit < 1 or limit > 1000:
        raise HTTPException(
            status_code=400,
            detail="Limit must be between 1 and 1000"
        )

    return database.get_history(
        source_id,
        limit
    )


# -------------------------------
# COLLECTOR INFORMATION
# -------------------------------

@app.get("/collectors")
def collectors():
    return database.get_collectors()