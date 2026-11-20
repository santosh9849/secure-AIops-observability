
from backend import database
from backend.models.telemetry import Telemetry


# Configurable prototype thresholds
THRESHOLDS = {
    "cpu": {
        "high": 90,
        "critical": 95
    },
    "memory": {
        "high": 90,
        "critical": 95
    },
    "disk": {
        "high": 90,
        "critical": 98
    },
    "network_latency": {
        "high": 500,
        "critical": 1000
    }
}


def detect_anomalies(payload: Telemetry) -> list[dict]:
    """
    Detect configured metric threshold violations.
    This is rule-based detection, not ML-based anomaly detection.
    """

    metrics = payload.metrics
    detected = []

    metric_values = {
        "cpu": metrics.cpu,
        "memory": metrics.memory,
        "disk": metrics.disk,
        "network_latency": metrics.network_latency
    }

    descriptions = {
        "cpu": (
            "Excessive processor resource consumption.",
            "Investigate resource-intensive processes."
        ),
        "memory": (
            "Possible memory exhaustion or memory leak.",
            "Inspect memory-intensive processes and investigate memory leaks."
        ),
        "disk": (
            "Storage capacity is approaching exhaustion.",
            "Review storage consumption and consider expanding capacity."
        ),
        "network_latency": (
            "Network response time is significantly elevated.",
            "Investigate network congestion, routes and connectivity."
        )
    }

    for metric_name, value in metric_values.items():

        limits = THRESHOLDS[metric_name]

        if value >= limits["critical"]:
            severity = "CRITICAL"
        elif value >= limits["high"]:
            severity = "HIGH"
        else:
            continue

        cause, recommendation = descriptions[metric_name]

        display_name = metric_name.replace("_", " ").title()

        detected.append({
            "title": f"High {display_name}",
            "severity": severity,
            "description": (
                f"{display_name} reached {value}."
            ),
            "probable_cause": cause,
            "recommendation": recommendation
        })

    return detected


def detect_and_create_incidents(
    payload: Telemetry,
    tenant_id: str
) -> list[dict]:
    """
    Detect anomalies and create incidents.
    Avoid creating duplicate open incidents for the same source.
    """

    detected = detect_anomalies(payload)

    existing = database.get_incidents(
        tenant_id=tenant_id,
        status="open",
        limit=500
    )

    created = []

    for anomaly in detected:

        already_open = any(
            incident["source_id"] == payload.source_id
            and incident["title"] == anomaly["title"]
            for incident in existing
        )

        if already_open:
            continue

        incident_id = database.create_incident(
            tenant_id=tenant_id,
            source_id=payload.source_id,
            title=anomaly["title"],
            severity=anomaly["severity"],
            description=anomaly["description"],
            probable_cause=anomaly["probable_cause"],
            recommendation=anomaly["recommendation"]
        )

        created.append({
            "incident_id": incident_id,
            "source_id": payload.source_id,
            "title": anomaly["title"],
            "severity": anomaly["severity"],
            "recommendation": anomaly["recommendation"]
        })

        existing.append({
            "source_id": payload.source_id,
            "title": anomaly["title"]
        })

    return created
