from typing import List, Dict, Any
from schemas.aiops_output import AnomalySignal

# Causal hierarchy: lower rank = more likely upstream root cause
CAUSAL_PRIORITY = {
    "failed_auth_count": 1,
    "packet_loss": 2,
    "disk_usage": 3,
    "cpu_usage": 4,
    "memory_usage": 5,
    "latency_ms": 6,
    "service_availability": 7,
    "multivariate_host_profile": 8,
}


class RootCauseAnalyzer:
    def analyze(self, cluster: List[AnomalySignal]) -> Dict[str, Any]:
        # Rank by causal precedence first, then earliest UTC timestamp, then anomaly score
        ranked = sorted(
            cluster,
            key=lambda s: (
                CAUSAL_PRIORITY.get(s.metric_name, 99),
                s.event_timestamp_utc,
                -s.anomaly_score,
            ),
        )
        root = ranked[0]
        downstream = ranked[1:]

        if downstream:
            symptoms = ", ".join(sorted({f"{d.metric_name} on {d.pseudonymous_host}" for d in downstream}))
            explanation = (
                f"Primary trigger identified as '{root.metric_name}' (value={root.metric_value}) "
                f"on {root.pseudonymous_host} at {root.event_timestamp_utc.isoformat()}, "
                f"preceding downstream symptoms ({symptoms})."
            )
        else:
            explanation = (
                f"Isolated anomaly on {root.pseudonymous_host}: {root.reason}."
            )

        avg_conf = round(sum(s.anomaly_score for s in cluster) / len(cluster), 2)

        return {
            "root_cause_metric": root.metric_name,
            "root_cause_host": root.pseudonymous_host,
            "root_cause_category": root.category,
            "root_cause_explanation": explanation,
            "confidence": min(0.99, round(avg_conf + (0.04 * min(len(downstream), 3)), 2)),
        }