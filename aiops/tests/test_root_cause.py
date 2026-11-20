
from datetime import datetime, timezone, timedelta

from root_cause.root_cause_analyzer import RootCauseAnalyzer
from schemas.aiops_output import AnomalySignal


def create_anomaly(event_id, metric, host, seconds, score=0.90):
    return AnomalySignal(
        event_id=event_id,
        tenant_id="TENANT_001",
        pseudonymous_host=host,
        category="infrastructure",
        metric_name=metric,
        metric_value=95.0,
        event_timestamp_utc=datetime(
            2026, 11, 20, 10, 0, tzinfo=timezone.utc
        ) + timedelta(seconds=seconds),
        detector_type="threshold",
        anomaly_score=score,
        reason="Test anomaly"
    )


def test_identifies_network_root_cause():
    analyzer = RootCauseAnalyzer()

    cluster = [
        create_anomaly("E1", "latency_ms", "SERVER_01", 10),
        create_anomaly("E2", "packet_loss", "SERVER_01", 0),
        create_anomaly("E3", "cpu_usage", "SERVER_01", 5),
    ]

    result = analyzer.analyze(cluster)

    assert result["root_cause_metric"] == "packet_loss"
    assert result["root_cause_host"] == "SERVER_01"


def test_identifies_security_root_cause():
    analyzer = RootCauseAnalyzer()

    cluster = [
        create_anomaly("E1", "cpu_usage", "SERVER_01", 0),
        create_anomaly("E2", "failed_auth_count", "SERVER_01", 10),
    ]

    result = analyzer.analyze(cluster)

    assert result["root_cause_metric"] == "failed_auth_count"


def test_returns_confidence():
    analyzer = RootCauseAnalyzer()

    cluster = [
        create_anomaly("E1", "cpu_usage", "SERVER_01", 0),
        create_anomaly("E2", "memory_usage", "SERVER_01", 10),
    ]

    result = analyzer.analyze(cluster)

    assert 0 <= result["confidence"] <= 0.99
    assert result["root_cause_explanation"]


def test_handles_single_anomaly():
    analyzer = RootCauseAnalyzer()

    cluster = [
        create_anomaly("E1", "cpu_usage", "SERVER_01", 0)
    ]

    result = analyzer.analyze(cluster)

    assert result["root_cause_metric"] == "cpu_usage"
    assert "Isolated anomaly" in result["root_cause_explanation"]
