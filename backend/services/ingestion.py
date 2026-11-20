import math
from datetime import datetime, timezone

from backend import database
from backend.models.telemetry import Telemetry
from backend.services.aiops_client import analyze_and_store_incidents


ALLOWED_EVENTS = {
    "bandwidth_upload_mbps": ("Mbps", 0, None),
    "bandwidth_download_mbps": ("Mbps", 0, None),
    "packet_loss": ("%", 0, 100),
    "network_probe_available": ("boolean", 0, 1),
}


def sanitize_events(events):
    approved = []
    rejected = 0

    for event in events:
        if not isinstance(event, dict):
            rejected += 1
            continue

        name = event.get("metric_name")

        if name not in ALLOWED_EVENTS:
            rejected += 1
            continue

        try:
            value = float(event.get("metric_value"))
        except (TypeError, ValueError):
            rejected += 1
            continue

        if not math.isfinite(value):
            rejected += 1
            continue

        unit, minimum, maximum = ALLOWED_EVENTS[name]

        if value < minimum or (
            maximum is not None and value > maximum
        ):
            rejected += 1
            continue

        approved.append({
            "metric_name": name,
            "metric_value": value,
            "category": "network",
            "unit": unit
        })

    return approved, rejected


def ingest_telemetry(payload: Telemetry, tenant_id: str) -> dict:

    timestamp = payload.timestamp

    if timestamp.tzinfo is None:
        timestamp = timestamp.replace(tzinfo=timezone.utc)

    event_time = timestamp.astimezone(
        timezone.utc
    ).isoformat()

    safe_events, rejected_count = sanitize_events(
        payload.events
    )

    safe_payload = payload.model_copy(
        update={"events": safe_events}
    )

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
        "events": safe_events
    }

    inserted = database.insert_payload(row)

    incidents = []
    engine = "skipped_duplicate"

    if inserted:

        database.record_egress_audit(
            tenant_id=tenant_id,
            collector_id=payload.collector_id,
            payload_id=payload.payload_id,
            destination="backend-and-aiops",
            approved_fields=[
                "payload_id",
                "collector_id",
                "source_id",
                "timestamp",
                "metrics.cpu",
                "metrics.memory",
                "metrics.disk",
                "metrics.network_latency",
                "health_status",
                "events.metric_name",
                "events.metric_value",
                "events.category",
                "events.unit"
            ],
            redacted_count=0,
            rejected_count=rejected_count,
            decision=(
                "approved"
                if rejected_count == 0
                else "partially_approved"
            )
        )

        result = analyze_and_store_incidents(
            safe_payload,
            tenant_id
        )

        incidents = result["incidents"]
        engine = result["engine"]

    return {
        "status": "accepted" if inserted else "duplicate",
        "payload_id": payload.payload_id,
        "tenant_id": tenant_id,
        "approved_events": len(safe_events),
        "rejected_events": rejected_count,
        "aiops_engine": engine,
        "incidents": incidents
    }