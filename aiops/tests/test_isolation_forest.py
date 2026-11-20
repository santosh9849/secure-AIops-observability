
from datetime import datetime, timezone, timedelta

from detection.isolation_forest import MultivariateIsolationForest
from schemas.aiops_output import TelemetryEventIn


def create_event(event_id, metric, value, minute):
    return TelemetryEventIn(
        event_id=event_id,
        tenant_id="TENANT_001",
        region="ap-south-1",
        collector_id="COL_001",
        event_timestamp_utc=datetime(
            2026, 11, 20, 10, 0, tzinfo=timezone.utc
        ) + timedelta(minutes=minute),
        source_timezone="Asia/Kolkata",
        pseudonymous_host="SERVER_01",
        category="infrastructure",
        metric_name=metric,
        metric_value=value,
    )


def test_detects_multivariate_anomaly():
    detector = MultivariateIsolationForest(contamination=0.08)

    events = []

    # Create 11 normal metric buckets
    for minute in range(11):
        events.append(
            create_event(
                f"CPU_{minute}",
                "cpu_usage",
                40 + minute * 0.2,
                minute
            )
        )
        events.append(
            create_event(
                f"MEM_{minute}",
                "memory_usage",
                50 + minute * 0.2,
                minute
            )
        )

    # Add one unusual metric bucket
    events.append(
        create_event("CPU_ANOMALY", "cpu_usage", 99, 11)
    )
    events.append(
        create_event("MEM_ANOMALY", "memory_usage", 98, 11)
    )

    result = detector.detect(events)

    assert len(result) >= 1
    assert any(
        item.detector_type == "isolation_forest"
        for item in result
    )


def test_insufficient_buckets_return_empty():
    detector = MultivariateIsolationForest()

    events = [
        create_event("CPU_1", "cpu_usage", 95, 0),
        create_event("MEM_1", "memory_usage", 90, 0),
    ]

    result = detector.detect(events)

    assert result == []
def test_isolation_forest_separates_tenants():
    detector = MultivariateIsolationForest(contamination=0.08)

    events = []

    # Tenant A: normal telemetry
    for minute in range(11):
        events.append(
            create_event(
                f"A_CPU_{minute}",
                "cpu_usage",
                40 + minute * 0.2,
                minute
            ).model_copy(update={"tenant_id": "TENANT_A"})
        )
        events.append(
            create_event(
                f"A_MEM_{minute}",
                "memory_usage",
                50 + minute * 0.2,
                minute
            ).model_copy(update={"tenant_id": "TENANT_A"})
        )

    # Tenant B: normal telemetry
    for minute in range(11):
        events.append(
            create_event(
                f"B_CPU_{minute}",
                "cpu_usage",
                40 + minute * 0.2,
                minute
            ).model_copy(update={"tenant_id": "TENANT_B"})
        )
        events.append(
            create_event(
                f"B_MEM_{minute}",
                "memory_usage",
                50 + minute * 0.2,
                minute
            ).model_copy(update={"tenant_id": "TENANT_B"})
        )

    # Add an unusual bucket only for Tenant B
    events.append(
        create_event("B_CPU_ANOMALY", "cpu_usage", 99, 11)
        .model_copy(update={"tenant_id": "TENANT_B"})
    )
    events.append(
        create_event("B_MEM_ANOMALY", "memory_usage", 98, 11)
        .model_copy(update={"tenant_id": "TENANT_B"})
    )

    result = detector.detect(events)

    assert all(item.tenant_id in {"TENANT_A", "TENANT_B"} for item in result)
    assert any(item.tenant_id == "TENANT_B" for item in result)