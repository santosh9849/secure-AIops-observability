
from datetime import datetime, timezone, timedelta

from correlation.event_correlator import EventCorrelator
from schemas.aiops_output import AnomalySignal


def create_anomaly(event_id, tenant, host, category, seconds, score=0.90):
    return AnomalySignal(
        event_id=event_id,
        tenant_id=tenant,
        pseudonymous_host=host,
        category=category,
        metric_name="cpu_usage",
        metric_value=95.0,
        event_timestamp_utc=datetime(
            2026, 11, 20, 10, 0, tzinfo=timezone.utc
        ) + timedelta(seconds=seconds),
        detector_type="threshold",
        anomaly_score=score,
        reason="Test anomaly"
    )


def test_correlates_same_host_events():
    correlator = EventCorrelator(window_seconds=90)

    anomalies = [
        create_anomaly("E1", "T1", "SERVER_01", "network", 0),
        create_anomaly("E2", "T1", "SERVER_01", "application", 30),
    ]

    result = correlator.correlate(anomalies)

    assert len(result) == 1
    assert len(result[0]) == 2


def test_separates_different_tenants():
    correlator = EventCorrelator()

    anomalies = [
        create_anomaly("E1", "T1", "SERVER_01", "network", 0),
        create_anomaly("E2", "T2", "SERVER_01", "network", 20),
    ]

    result = correlator.correlate(anomalies)

    assert len(result) == 2


def test_deduplicates_same_event_id():
    correlator = EventCorrelator()

    anomalies = [
        create_anomaly("E1", "T1", "SERVER_01", "network", 0, 0.70),
        create_anomaly("E1", "T1", "SERVER_01", "network", 0, 0.95),
    ]

    result = correlator.correlate(anomalies)

    assert len(result) == 1
    assert len(result[0]) == 1
    assert result[0][0].anomaly_score == 0.95


def test_events_outside_time_window():
    correlator = EventCorrelator(window_seconds=90)

    anomalies = [
        create_anomaly("E1", "T1", "SERVER_01", "network", 0),
        create_anomaly("E2", "T1", "SERVER_01", "network", 120),
    ]

    result = correlator.correlate(anomalies)

    assert len(result) == 2
def test_same_event_id_from_different_tenants_is_preserved():
    correlator = EventCorrelator()

    anomalies = [
        create_anomaly("E1", "TENANT_A", "SERVER_01", "network", 0, 0.90),
        create_anomaly("E1", "TENANT_B", "SERVER_02", "network", 0, 0.95),
    ]

    result = correlator.correlate(anomalies)

    # Both tenants' events must be preserved
    assert len(result) == 2

    preserved_tenants = {
        cluster[0].tenant_id for cluster in result
    }

    assert preserved_tenants == {"TENANT_A", "TENANT_B"}

