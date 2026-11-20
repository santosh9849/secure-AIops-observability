from collections import defaultdict
from typing import Dict, List
import numpy as np
from schemas.aiops_output import TelemetryEventIn, AnomalySignal


class StatisticalDetector:
    def __init__(self, z_threshold: float = 2.8):
        self.z_threshold = z_threshold
        # In-memory rolling history keyed by (tenant_id, pseudonymous_host, metric_name)
        self.history: Dict[tuple, List[float]] = defaultdict(list)

    def seed_baseline(self, tenant_id: str, host: str, metric: str, values: List[float]):
        self.history[(tenant_id, host, metric)].extend(values[-100:])

    def detect(self, events: List[TelemetryEventIn]) -> List[AnomalySignal]:
        anomalies: List[AnomalySignal] = []

        # Sort by UTC event timestamp so out-of-order arrivals don't skew rolling stats
        sorted_events = sorted(events, key=lambda e: e.event_timestamp_utc)

        for evt in sorted_events:
            key = (evt.tenant_id, evt.pseudonymous_host, evt.metric_name)
            series = self.history[key]

            if len(series) >= 8:
                mean = float(np.mean(series))
                std = float(np.std(series))

                if std > 1e-6:
                    z_score = abs((evt.metric_value - mean) / std)
                    if z_score >= self.z_threshold:
                        confidence = min(0.99, round(0.65 + (z_score - self.z_threshold) * 0.1, 2))
                        anomalies.append(
                            AnomalySignal(
                                event_id=evt.event_id,
                                tenant_id=evt.tenant_id,
                                pseudonymous_host=evt.pseudonymous_host,
                                category=evt.category,
                                metric_name=evt.metric_name,
                                metric_value=evt.metric_value,
                                event_timestamp_utc=evt.event_timestamp_utc,
                                detector_type="z_score",
                                anomaly_score=confidence,
                                reason=f"Statistical deviation (Z={z_score:.2f}): value {evt.metric_value} vs baseline mean {mean:.2f}±{std:.2f}",
                            )
                        )

            # Update rolling window (keep last 100 samples)
            series.append(evt.metric_value)
            if len(series) > 100:
                self.history[key] = series[-100:]

        return anomalies