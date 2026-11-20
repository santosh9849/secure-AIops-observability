from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class TelemetryEventIn(BaseModel):
    event_id: str
    tenant_id: str
    region: str = "us-east"
    collector_id: str
    event_timestamp_utc: datetime
    source_timezone: str = "UTC"
    pseudonymous_host: str
    category: str  # infrastructure | network | security | application
    metric_name: str  # cpu_usage, memory_usage, packet_loss, latency_ms, failed_auth_count, etc.
    metric_value: float
    unit: Optional[str] = None
    severity: Optional[str] = "INFO"
    alert_context: Optional[str] = None


class AnalyzeBatchRequest(BaseModel):
    tenant_id: str
    region: str = "us-east"
    events: List[TelemetryEventIn]
    historical_baseline: Optional[Dict[str, List[float]]] = Field(default_factory=dict)


class AnomalySignal(BaseModel):
    event_id: str
    tenant_id: str
    pseudonymous_host: str
    category: str
    metric_name: str
    metric_value: float
    event_timestamp_utc: datetime
    detector_type: str  # threshold | z_score | isolation_forest
    anomaly_score: float  # 0.0 to 1.0 normalized confidence
    reason: str


class CorrelatedIncidentOut(BaseModel):
    incident_id: str
    tenant_id: str
    region: str
    title: str
    severity: str  # LOW | MEDIUM | HIGH | CRITICAL
    priority_score: int  # 1 to 100
    status: str = "OPEN"
    started_at_utc: datetime
    last_updated_utc: datetime
    affected_hosts: List[str]
    affected_categories: List[str]
    root_cause_metric: str
    root_cause_host: str
    root_cause_explanation: str
    confidence: float
    correlated_event_count: int
    evidence: List[str]
    recommended_actions: List[Dict[str, Any]]


class AnalyzeBatchResponse(BaseModel):
    tenant_id: str
    processed_events: int
    anomalies_detected: int
    incidents_generated: int
    processing_time_ms: float
    anomalies: List[AnomalySignal]
    incidents: List[CorrelatedIncidentOut]