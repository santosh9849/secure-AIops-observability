from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_health_endpoint():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"


def test_correlated_incident_and_out_of_order_handling():
    base_time = datetime(2026, 11, 20, 10, 0, 0, tzinfo=timezone.utc)

    # Intentionally send downstream latency event BEFORE upstream packet_loss event
    payload = {
        "tenant_id": "tenant_eu_01",
        "region": "eu-central",
        "events": [
            {
                "event_id": "evt-2",
                "tenant_id": "tenant_eu_01",
                "region": "eu-central",
                "collector_id": "col-1",
                "event_timestamp_utc": (base_time + timedelta(seconds=15)).isoformat(),
                "pseudonymous_host": "node_a1b2c3",
                "category": "application",
                "metric_name": "latency_ms",
                "metric_value": 640.0,
            },
            {
                "event_id": "evt-1",
                "tenant_id": "tenant_eu_01",
                "region": "eu-central",
                "collector_id": "col-1",
                "event_timestamp_utc": base_time.isoformat(),
                "pseudonymous_host": "node_a1b2c3",
                "category": "network",
                "metric_name": "packet_loss",
                "metric_value": 7.5,
            },
            {
                "event_id": "evt-3",
                "tenant_id": "tenant_eu_01",
                "region": "eu-central",
                "collector_id": "col-1",
                "event_timestamp_utc": (base_time + timedelta(seconds=20)).isoformat(),
                "pseudonymous_host": "node_a1b2c3",
                "category": "security",
                "metric_name": "failed_auth_count",
                "metric_value": 18.0,
            },
        ],
    }

    res = client.post("/analyze", json=payload)
    assert res.status_code == 200
    data = res.json()

    assert data["anomalies_detected"] == 3
    assert data["incidents_generated"] == 1
    assert data["processing_time_ms"] < 2000  # Well under 15s SLA

    incident = data["incidents"][0]
    assert incident["severity"] == "CRITICAL"
    assert incident["correlated_event_count"] == 3
    assert incident["root_cause_metric"] == "failed_auth_count"
    assert len(incident["recommended_actions"]) >= 1
def test_rejects_event_from_different_tenant():
    payload = {
        "tenant_id": "tenant_A",
        "events": [
            {
                "event_id": "evt-security-1",
                "tenant_id": "tenant_B",
                "collector_id": "col-1",
                "event_timestamp_utc": "2026-11-20T10:00:00+00:00",
                "pseudonymous_host": "node_test",
                "category": "security",
                "metric_name": "failed_auth_count",
                "metric_value": 10.0,
            }
        ],
    }

    res = client.post("/analyze", json=payload)

    assert res.status_code == 400
    assert res.json()["detail"] == (
        "All telemetry events must belong to the request tenant."
    )
    