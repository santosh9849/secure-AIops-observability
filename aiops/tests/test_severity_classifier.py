
from datetime import datetime, timezone

from severity.severity_classifier import SeverityClassifier
from schemas.aiops_output import AnomalySignal


def create_anomaly(metric, score, host="SERVER_01",
                   category="infrastructure", value=95.0):
    return AnomalySignal(
        event_id=f"TEST_{metric}_{host}",
        tenant_id="TENANT_001",
        pseudonymous_host=host,
        category=category,
        metric_name=metric,
        metric_value=value,
        event_timestamp_utc=datetime.now(timezone.utc),
        detector_type="threshold",
        anomaly_score=score,
        reason="Test anomaly"
    )


def test_empty_cluster():
    classifier = SeverityClassifier()
    assert classifier.classify([]) == ("LOW", 0)


def test_critical_security_incident():
    classifier = SeverityClassifier()
    cluster = [
        create_anomaly("failed_auth_count", 0.95, category="security"),
        create_anomaly("cpu_usage", 0.95)
    ]
    severity, score = classifier.classify(cluster)
    assert severity == "CRITICAL"


def test_service_outage_is_critical():
    classifier = SeverityClassifier()
    cluster = [
        create_anomaly("service_availability", 0.80, value=90)
    ]
    severity, score = classifier.classify(cluster)
    assert severity == "CRITICAL"


def test_multiple_hosts_increase_priority():
    classifier = SeverityClassifier()
    cluster = [
        create_anomaly("cpu_usage", 0.80, host="SERVER_01"),
        create_anomaly("memory_usage", 0.80, host="SERVER_02")
    ]
    severity, score = classifier.classify(cluster)
    assert score == 66
    assert severity == "MEDIUM"
    


def test_normal_cluster_is_low():
    classifier = SeverityClassifier()
    cluster = [
        create_anomaly("cpu_usage", 0.40)
    ]
    severity, score = classifier.classify(cluster)
    assert severity == "LOW"
    assert score == 28
