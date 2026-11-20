import time
import uuid

from fastapi import FastAPI, HTTPException

from schemas.aiops_output import (
    AnalyzeBatchRequest,
    AnalyzeBatchResponse,
    CorrelatedIncidentOut,
)
from detection.threshold_detector import ThresholdDetector
from detection.statistical_detector import StatisticalDetector
from detection.isolation_forest import MultivariateIsolationForest
from correlation.event_correlator import EventCorrelator
from root_cause.root_cause_analyzer import RootCauseAnalyzer
from severity.severity_classifier import SeverityClassifier
from recommendations.recommendation_engine import RecommendationEngine


app = FastAPI(
    title="Secure AIOps Engine",
    description=(
        "Real-time anomaly detection, correlation, root-cause "
        "analysis and operational recommendations"
    ),
    version="1.0.0",
)

# Initialize AIOps components
threshold_detector = ThresholdDetector()
statistical_detector = StatisticalDetector()
isolation_forest = MultivariateIsolationForest()
correlator = EventCorrelator(window_seconds=90)
rca_analyzer = RootCauseAnalyzer()
severity_classifier = SeverityClassifier()
recommendation_engine = RecommendationEngine()


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "aiops-engine",
    }


@app.post("/analyze", response_model=AnalyzeBatchResponse)
def analyze_telemetry(request: AnalyzeBatchRequest):

    start_time = time.perf_counter()

    # Validate tenant ownership
    if any(
        event.tenant_id != request.tenant_id
        for event in request.events
    ):
        raise HTTPException(
            status_code=400,
            detail="All telemetry events must belong to the request tenant.",
        )

    # Optional baseline seeding from backend history
    for key, values in (request.historical_baseline or {}).items():
        if ":" in key:
            host, metric = key.split(":", 1)

            statistical_detector.seed_baseline(
                request.tenant_id,
                host,
                metric,
                values,
            )

    # 1. Run multi-model anomaly detection
    raw_anomalies = []

    raw_anomalies.extend(
        threshold_detector.detect(request.events)
    )
    raw_anomalies.extend(
        statistical_detector.detect(request.events)
    )
    raw_anomalies.extend(
        isolation_forest.detect(request.events)
    )

    # 2. Correlate anomalies across time, hosts, and domains
    clusters = correlator.correlate(raw_anomalies)

    # 3. Build incidents with RCA, severity, and recommendations
    incidents: list[CorrelatedIncidentOut] = []

    for cluster in clusters:

        rca = rca_analyzer.analyze(cluster)

        severity, priority = severity_classifier.classify(cluster)

        recommendations = recommendation_engine.recommend(
            rca["root_cause_metric"],
            rca["root_cause_host"],
        )

        hosts = sorted({
            signal.pseudonymous_host for signal in cluster
        })

        categories = sorted({
            signal.category for signal in cluster
        })

        timestamps = [
            signal.event_timestamp_utc for signal in cluster
        ]

        incidents.append(
            CorrelatedIncidentOut(
                incident_id=f"INC-{uuid.uuid4().hex[:8].upper()}",
                tenant_id=request.tenant_id,
                region=request.region,
                title=(
                    f"[{severity}] "
                    f"{rca['root_cause_metric'].replace('_', ' ').title()} "
                    f"Cascade on {rca['root_cause_host']}"
                ),
                severity=severity,
                priority_score=priority,
                started_at_utc=min(timestamps),
                last_updated_utc=max(timestamps),
                affected_hosts=hosts,
                affected_categories=categories,
                root_cause_metric=rca["root_cause_metric"],
                root_cause_host=rca["root_cause_host"],
                root_cause_explanation=rca["root_cause_explanation"],
                confidence=rca["confidence"],
                correlated_event_count=len(cluster),
                evidence=[
                    f"[{signal.detector_type}] "
                    f"{signal.pseudonymous_host}: {signal.reason}"
                    for signal in cluster
                ],
                recommended_actions=recommendations,
            )
        )

    # 4. Deduplicate anomalies using tenant ID and event ID
    deduped_map = {}

    for signal in raw_anomalies:
        key = (signal.tenant_id, signal.event_id)

        if (
            key not in deduped_map
            or signal.anomaly_score > deduped_map[key].anomaly_score
        ):
            deduped_map[key] = signal

    unique_anomalies = list(deduped_map.values())

    elapsed_ms = round(
        (time.perf_counter() - start_time) * 1000,
        2,
    )

    # 5. Return analysis response
    return AnalyzeBatchResponse(
        tenant_id=request.tenant_id,
        processed_events=len(request.events),
        anomalies_detected=len(unique_anomalies),
        incidents_generated=len(incidents),
        processing_time_ms=elapsed_ms,
        anomalies=unique_anomalies,
        incidents=incidents,
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8001,
        reload=True,
    )