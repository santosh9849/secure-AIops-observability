import hashlib
import hmac
import json
import logging
import math
import os

from datetime import timezone
from urllib.request import Request, urlopen
from urllib.error import URLError

from backend import database
from backend.models.telemetry import Telemetry
from backend.services.anomaly_detection import (
    detect_and_create_incidents
)

logger = logging.getLogger(__name__)

AIOPS_URL = os.getenv(
    "AIOPS_URL",
    "http://127.0.0.1:8001"
).rstrip("/")

AIOPS_TIMEOUT = float(
    os.getenv("AIOPS_TIMEOUT_SECONDS", "5")
)


def pseudonymize_host(tenant_id, source_id):

    secret = os.getenv(
        "SENTINEL_PSEUDONYM_KEY",
        "local-demo-only-change-this"
    ).encode()

    value = f"{tenant_id}:{source_id}".encode()

    digest = hmac.new(
        secret,
        value,
        hashlib.sha256
    ).hexdigest()[:16]

    return f"HOST-{digest.upper()}"


def build_analysis_request(payload: Telemetry, tenant_id: str):

    timestamp = payload.timestamp

    if timestamp.tzinfo is None:
        timestamp = timestamp.replace(tzinfo=timezone.utc)

    timestamp = timestamp.astimezone(
        timezone.utc
    ).isoformat()

    host = pseudonymize_host(
        tenant_id,
        payload.source_id
    )

    metrics = [
        ("cpu_usage", payload.metrics.cpu, "infrastructure", "%"),
        ("memory_usage", payload.metrics.memory, "infrastructure", "%"),
        ("disk_usage", payload.metrics.disk, "infrastructure", "%"),
        ("latency_ms", payload.metrics.network_latency, "network", "ms"),
    ]

    # Add additional network measurements from collector events.
    supported_events = {
        "bandwidth_upload_mbps",
        "bandwidth_download_mbps",
        "packet_loss",
    }

    for event in payload.events:

        metric_name = event.get("metric_name")

        if metric_name not in supported_events:
            continue

        try:
            value = float(event.get("metric_value"))
        except (TypeError, ValueError):
            continue

        if not math.isfinite(value):
            continue

        metrics.append((
            metric_name,
            value,
            event.get("category", "network"),
            event.get("unit", "")
        ))

    events = []

    for metric_name, value, category, unit in metrics:

        event_key = (
            f"{tenant_id}:{payload.payload_id}:{metric_name}"
        )

        event_id = hashlib.sha256(
            event_key.encode()
        ).hexdigest()[:24]

        events.append({
            "event_id": event_id,
            "tenant_id": tenant_id,
            "region": os.getenv("SENTINEL_REGION", "local"),
            "collector_id": payload.collector_id,
            "event_timestamp_utc": timestamp,
            "source_timezone": payload.source_timezone,
            "pseudonymous_host": host,
            "category": category,
            "metric_name": metric_name,
            "metric_value": value,
            "unit": unit,
            "severity": payload.health_status
        })

    return {
        "tenant_id": tenant_id,
        "region": os.getenv("SENTINEL_REGION", "local"),
        "events": events
    }


def call_aiops(request_data):

    request = Request(
        f"{AIOPS_URL}/analyze",
        data=json.dumps(request_data).encode(),
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        method="POST"
    )

    with urlopen(
        request,
        timeout=AIOPS_TIMEOUT
    ) as response:

        return json.loads(
            response.read().decode()
        )


def format_recommendations(actions):

    recommendations = []

    for action in actions or []:

        if isinstance(action, dict):

            text = (
                action.get("description")
                or action.get("action")
                or action.get("title")
                or action.get("recommendation")
                or action.get("command_preview")
            )

            if text:

                if action.get("requires_human_approval"):
                    text += " (human approval required)"

                recommendations.append(text)

        elif action:
            recommendations.append(str(action))

    return "\n".join(recommendations)


def store_aiops_incidents(result, tenant_id):

    stored_incidents = []

    existing_incidents = database.get_incidents(
        tenant_id=tenant_id,
        limit=500
    )

    for incident in result.get("incidents", []):

        source_id = incident.get(
            "root_cause_host",
            "UNKNOWN"
        )

        title = incident.get(
            "title",
            "AIOps detected anomaly"
        )

        severity = str(
            incident.get("severity", "MEDIUM")
        ).upper()

        if severity not in {
            "LOW", "MEDIUM", "HIGH", "CRITICAL"
        }:
            severity = "MEDIUM"

        duplicate = next(
            (
                item for item in existing_incidents
                if item.get("source_id") == source_id
                and item.get("title") == title
                and str(item.get("status", "")).lower()
                in {"open", "acknowledged"}
            ),
            None
        )

        if duplicate:

            stored_incidents.append({
                "incident_id": duplicate["incident_id"],
                "source_id": source_id,
                "title": title,
                "severity": severity,
                "recommendation": duplicate.get(
                    "recommendation", ""
                )
            })

            continue

        recommendation = format_recommendations(
            incident.get("recommended_actions", [])
        )

        incident_id = database.create_incident(
            tenant_id=tenant_id,
            source_id=source_id,
            title=title,
            severity=severity,
            description=incident.get(
                "root_cause_explanation"
            ),
            probable_cause=incident.get(
                "root_cause_metric"
            ),
            recommendation=recommendation,
            confidence=incident.get("confidence")
        )

        stored_incidents.append({
            "incident_id": incident_id,
            "source_id": source_id,
            "title": title,
            "severity": severity,
            "recommendation": recommendation
        })

        existing_incidents.append({
            "incident_id": incident_id,
            "source_id": source_id,
            "title": title,
            "status": "open"
        })

    return stored_incidents


def analyze_and_store_incidents(payload, tenant_id):

    try:

        request_data = build_analysis_request(
            payload,
            tenant_id
        )

        result = call_aiops(request_data)

        incidents = store_aiops_incidents(
            result,
            tenant_id
        )

        return {
            "engine": "aiops",
            "incidents": incidents
        }

    except (URLError, TimeoutError, OSError, ValueError) as error:

        logger.warning(
            "AIOps unavailable; using local threshold detection: %s",
            error
        )

        incidents = detect_and_create_incidents(
            payload,
            tenant_id
        )

        return {
            "engine": "local_threshold_fallback",
            "incidents": incidents
        }