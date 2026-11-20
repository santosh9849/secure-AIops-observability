
from datetime import datetime, timezone

from backend import database
from backend.models.telemetry import Telemetry


def ingest_telemetry(payload: Telemetry) -> dict:

    timestamp = payload.timestamp

    if timestamp.tzinfo is None:
        timestamp = timestamp.replace(tzinfo=timezone.utc)

    event_time = timestamp.astimezone(
        timezone.utc
    ).isoformat()

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

    return {
        "status": "accepted" if inserted else "duplicate",
        "payload_id": payload.payload_id
    }
