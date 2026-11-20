
from typing import List, Tuple
from schemas.aiops_output import AnomalySignal


class SeverityClassifier:

    def classify(self, cluster: List[AnomalySignal]) -> Tuple[str, int]:

        if not cluster:
            return "LOW", 0

        max_score = max(s.anomaly_score for s in cluster)

        has_security = any(
            s.category == "security" or s.metric_name == "failed_auth_count"
            for s in cluster
        )

        has_outage = any(
            s.metric_name == "service_availability"
            and s.metric_value < 95.0
            for s in cluster
        )

        critical_count = sum(
            1 for s in cluster if s.anomaly_score >= 0.90
        )

        host_count = len({
            s.pseudonymous_host for s in cluster
        })

        base_priority = int(max_score * 70)

        if has_security:
            base_priority += 20

        if has_outage:
            base_priority += 20

        if host_count > 1:
            base_priority += 10

        if critical_count >= 2:
            base_priority += 20

        priority_score = min(100, base_priority)

        if has_outage or (has_security and critical_count >= 2):
            return "CRITICAL", priority_score

        if critical_count >= 2 or priority_score >= 85:
            return "CRITICAL", priority_score

        if priority_score >= 70:
            return "HIGH", priority_score

        if priority_score >= 50:
            return "MEDIUM", priority_score

        return "LOW", priority_score
