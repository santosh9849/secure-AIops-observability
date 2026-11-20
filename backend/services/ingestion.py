
from datetime import datetime, timezone

from backend import database
from backend.models.telemetry import Telemetry
from backend.services.anomaly_detection import (
    detect_and_create_incidents
)


def ingest_telemetry(
    payload: Telemetry,
    tenant_id: str
) -> dict:

    # Normalize timestamp to UTC
    timestamp = payload.timestamp

    if timestamp.tzinfo is None:
        timestamp = timestamp.replace(tzinfo=timezone.utc)

    event_time = timestamp.astimezone(
        timezone.utc
    ).isoformat()

    # Prepare telemetry for database insertion
    row = {
        "tenant_id": tenant_id,
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

    # Save telemetry and prevent duplicates
    inserted = database.insert_payload(row)

    # Generate incidents only for newly accepted payloads
    incidents = []

    if inserted:
        incidents = detect_and_create_incidents(
            payload,
            tenant_id
        )

    return {
        "status": "accepted" if inserted else "duplicate",
        "payload_id": payload.payload_id,
        "tenant_id": tenant_id,
        "incidents": incidents
    }
