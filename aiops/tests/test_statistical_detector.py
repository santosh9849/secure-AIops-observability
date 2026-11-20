
from datetime import datetime, timezone

from detection.statistical_detector import StatisticalDetector
from schemas.aiops_output import TelemetryEventIn


def create_event(event_id, value, timestamp=None):
    return TelemetryEventIn(
        event_id=event_id,
        tenant_id="TENANT_001",
        region="ap-south-1",
        collector_id="COL_001",
        event_timestamp_utc=timestamp or datetime.now(timezone.utc),
        source_timezone="Asia/Kolkata",
        pseudonymous_host="SERVER_01",
        category="infrastructure",
        metric_name="cpu_usage",
        metric_value=value,
    )


def test_detects_statistical_anomaly():
    detector = StatisticalDetector(z_threshold=2.8)

    # Normal historical CPU values
    detector.seed_baseline(
        "TENANT_001",
        "SERVER_01",
        "cpu_usage",
        [40, 41, 39, 42, 40, 41, 39, 40, 42, 41]
    )

    event = create_event("TEST_001", 95)

    result = detector.detect([event])

    assert len(result) == 1
    assert result[0].detector_type == "z_score"


def test_normal_value_not_detected():
    detector = StatisticalDetector()

    detector.seed_baseline(
        "TENANT_001",
        "SERVER_01",
        "cpu_usage",
        [40, 41, 39, 42, 40, 41, 39, 40, 42, 41]
    )

    event = create_event("TEST_002", 41)

    result = detector.detect([event])

    assert len(result) == 0


def test_separate_tenant_history():
    detector = StatisticalDetector()

    detector.seed_baseline(
        "TENANT_002",
        "SERVER_01",
        "cpu_usage",
        [40, 41, 39, 42, 40, 41, 39, 40]
    )

    event = create_event("TEST_003", 95)

    result = detector.detect([event])

    # Different tenant: no baseline should be shared
    assert len(result) == 0
