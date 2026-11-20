from typing import List
from schemas.aiops_output import AnomalySignal


class EventCorrelator:
    def __init__(self, window_seconds: int = 90):
        self.window_seconds = window_seconds

    def correlate(self, anomalies: List[AnomalySignal]) -> List[List[AnomalySignal]]:
        if not anomalies:
            return []

        # Deduplicate by tenant and event ID
        deduped_map = {}

        for a in anomalies:
            key = (a.tenant_id, a.event_id)

            if (
                key not in deduped_map
                or a.anomaly_score > deduped_map[key].anomaly_score
            ):
                deduped_map[key] = a

        # Sort strictly by UTC event_timestamp_utc
        # to guarantee out-of-order resilience
        sorted_signals = sorted(
            deduped_map.values(),
            key=lambda x: x.event_timestamp_utc
        )

        clusters: List[List[AnomalySignal]] = []
        visited = set()

        for i, anchor in enumerate(sorted_signals):
            if i in visited:
                continue

            cluster = [anchor]
            visited.add(i)

            for j in range(i + 1, len(sorted_signals)):
                if j in visited:
                    continue

                candidate = sorted_signals[j]

                if candidate.tenant_id != anchor.tenant_id:
                    continue

                delta_sec = (
                    candidate.event_timestamp_utc
                    - anchor.event_timestamp_utc
                ).total_seconds()

                if delta_sec > self.window_seconds:
                    break

                # Group if same host OR cross-domain cascade
                same_host = (
                    candidate.pseudonymous_host
                    == anchor.pseudonymous_host
                )
                cross_domain_cascade = (
                    candidate.category != anchor.category
                )

                if same_host or cross_domain_cascade:
                    cluster.append(candidate)
                    visited.add(j)

            clusters.append(cluster)

        return clusters