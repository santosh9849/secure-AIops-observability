
from datetime import datetime, timezone

from detection.threshold_detector import ThresholdDetector
from schemas.aiops_output import TelemetryEventIn


def create_event(metric_name, metric_value):
    return TelemetryEventIn(
        event_id="TEST_001",
        tenant_id="TENANT_001",
        region="ap-south-1",
        collector_id="COL_001",
        event_timestamp_utc=datetime.now(timezone.utc),
        source_timezone="Asia/Kolkata",
        pseudonymous_host="SERVER_01",
        category="infrastructure",
        metric_name=metric_name,
        metric_value=metric_value,
    )


def test_critical_cpu_detection():
    detector = ThresholdDetector()

    event = create_event("cpu_usage", 96)

    result = detector.detect([event])

    assert len(result) == 1
    assert result[0].detector_type == "threshold"
    assert result[0].anomaly_score == 0.95


def test_normal_cpu_not_detected():
    detector = ThresholdDetector()

    event = create_event("cpu_usage", 40)

    result = detector.detect([event])

    assert len(result) == 0


def test_warning_cpu_detection():
    detector = ThresholdDetector()

    event = create_event("cpu_usage", 85)

    result = detector.detect([event])

    assert len(result) == 1
    assert result[0].anomaly_score == 0.72
