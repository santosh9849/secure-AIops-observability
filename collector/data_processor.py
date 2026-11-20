
import uuid
from typing import List, Dict, Any
from security_filter import SecurityFilter


class DataProcessor:

    # Constructor
    def __init__(
        self,
        tenant_id: str,
        region: str,
        collector_id: str,
        security_filter: SecurityFilter
    ):
        self.tenant_id = tenant_id
        self.region = region
        self.collector_id = collector_id
        self.security_filter = security_filter

    # Classify system health
    def _classify_local_health(
        self, metric: str, value: float
    ) -> tuple[str, str]:

        if metric == "cpu_usage" and value > 90:
            return "CRITICAL", "DEGRADED"

        if metric == "memory_usage" and value > 90:
            return "CRITICAL", "DEGRADED"

        if metric == "latency_ms" and value > 500:
            return "CRITICAL", "DEGRADED"

        if metric == "packet_loss" and value > 5.0:
            return "CRITICAL", "DEGRADED"

        if metric == "failed_auth_count" and value >= 15:
            return "CRITICAL", "AT_RISK"

        if metric == "failed_auth_count" and value >= 5:
            return "WARNING", "AT_RISK"

        return "INFO", "HEALTHY"

    # Process raw telemetry events
    def process_events(
        self,
        raw_events: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:

        approved_events = []

        for raw in raw_events:

            metric = raw["metric_name"]
            val = float(raw["metric_value"])

            severity, health_state = self._classify_local_health(
                metric, val
            )

            # Generate metadata-only context
            context = (
                f"Local threshold elevated for {metric}={val}{raw.get('unit', '')}"
                if severity != "INFO"
                else f"Normal telemetry rollup for {metric}"
            )

            # Create event metadata
            candidate = {
                "event_id": f"evt-{uuid.uuid4().hex[:12]}",
                "tenant_id": self.tenant_id,
                "region": self.region,
                "collector_id": self.collector_id,
                "event_timestamp_utc": raw["event_timestamp_utc"],
                "source_timezone": raw.get("source_timezone", "UTC"),
                "raw_host": raw.get("raw_host"),
                "category": raw["category"],
                "metric_name": metric,
                "metric_value": val,
                "unit": raw.get("unit"),
                "severity": severity,
                "health_state": health_state,
                "alert_context": context,
            }

            # Apply security filtering
            sanitized = self.security_filter.filter_and_sanitize(
                candidate
            )

            approved_events.append(sanitized)

        return approved_events
