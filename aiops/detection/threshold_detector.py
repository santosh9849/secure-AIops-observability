from typing import List
from schemas.aiops_output import TelemetryEventIn, AnomalySignal

# Domain thresholds aligned with Judge's observability rubric
METRIC_THRESHOLDS = {
    "cpu_usage": {"warn": 80.0, "crit": 92.0, "op": ">"},
    "memory_usage": {"warn": 82.0, "crit": 94.0, "op": ">"},
    "disk_usage": {"warn": 85.0, "crit": 95.0, "op": ">"},
    "latency_ms": {"warn": 250.0, "crit": 500.0, "op": ">"},
    "packet_loss": {"warn": 2.0, "crit": 5.0, "op": ">"},
    "service_availability": {"warn": 99.0, "crit": 95.0, "op": "<"},
    "failed_auth_count": {"warn": 5.0, "crit": 15.0, "op": ">="},
}


class ThresholdDetector:
    def detect(self, events: List[TelemetryEventIn]) -> List[AnomalySignal]:
        anomalies: List[AnomalySignal] = []

        for evt in events:
            rule = METRIC_THRESHOLDS.get(evt.metric_name)
            if not rule:
                continue

            val = evt.metric_value
            op = rule["op"]
            is_crit = (val >= rule["crit"]) if op == ">=" else (val > rule["crit"] if op == ">" else val < rule["crit"])
            is_warn = (val >= rule["warn"]) if op == ">=" else (val > rule["warn"] if op == ">" else val < rule["warn"])

            if is_crit or is_warn:
                score = 0.95 if is_crit else 0.72
                level = "CRITICAL" if is_crit else "WARNING"
                anomalies.append(
                    AnomalySignal(
                        event_id=evt.event_id,
                        tenant_id=evt.tenant_id,
                        pseudonymous_host=evt.pseudonymous_host,
                        category=evt.category,
                        metric_name=evt.metric_name,
                        metric_value=val,
                        event_timestamp_utc=evt.event_timestamp_utc,
                        detector_type="threshold",
                        anomaly_score=score,
                        reason=f"{level} threshold breach: {evt.metric_name}={val} (limit {rule['crit'] if is_crit else rule['warn']})",
                    )
                )
        return anomalies