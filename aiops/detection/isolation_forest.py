
from collections import defaultdict
from typing import List
import numpy as np
from sklearn.ensemble import IsolationForest
from schemas.aiops_output import TelemetryEventIn, AnomalySignal

FEATURE_ORDER = ["cpu_usage", "memory_usage", "latency_ms", "packet_loss"]


class MultivariateIsolationForest:
    def __init__(self, contamination: float = 0.08):
        self.contamination = contamination

    def detect(self, events: List[TelemetryEventIn]) -> List[AnomalySignal]:
        anomalies: List[AnomalySignal] = []

        # Group events by tenant, host and minute
        buckets = defaultdict(dict)
        bucket_meta = {}
        tenant_keys = defaultdict(list)

        for evt in events:
            if evt.metric_name in FEATURE_ORDER:
                ts_bucket = evt.event_timestamp_utc.replace(
                    second=0, microsecond=0
                )
                key = (evt.tenant_id, evt.pseudonymous_host, ts_bucket)

                buckets[key][evt.metric_name] = evt.metric_value
                bucket_meta[key] = evt

                if key not in tenant_keys[evt.tenant_id]:
                    tenant_keys[evt.tenant_id].append(key)

        # Train a separate model for each tenant
        for tenant_id, keys in tenant_keys.items():

            valid_keys = [
                key for key in keys
                if len(buckets[key]) >= 2
            ]

            if len(valid_keys) < 10:
                continue

            matrix = []

            for key in valid_keys:
                feats = buckets[key]
                row = [feats.get(m, 0.0) for m in FEATURE_ORDER]
                matrix.append(row)

            X = np.array(matrix, dtype=float)

            clf = IsolationForest(
                n_estimators=100,
                contamination=self.contamination,
                random_state=42,
            )

            preds = clf.fit_predict(X)
            scores = clf.decision_function(X)

            for idx, pred in enumerate(preds):
                if pred == -1:
                    key = valid_keys[idx]
                    rep_evt = bucket_meta[key]

                    norm_score = min(
                        0.98,
                        max(0.65, round(0.75 - float(scores[idx]), 2))
                    )

                    anomalies.append(
                        AnomalySignal(
                            event_id=rep_evt.event_id,
                            tenant_id=tenant_id,
                            pseudonymous_host=rep_evt.pseudonymous_host,
                            category="infrastructure",
                            metric_name="multivariate_host_profile",
                            metric_value=round(float(np.max(X[idx])), 2),
                            event_timestamp_utc=rep_evt.event_timestamp_utc,
                            detector_type="isolation_forest",
                            anomaly_score=norm_score,
                            reason=(
                                "Multivariate ML anomaly across host metrics "
                                f"{dict(zip(FEATURE_ORDER, X[idx].tolist()))}"
                            ),
                        )
                    )

        return anomalies
