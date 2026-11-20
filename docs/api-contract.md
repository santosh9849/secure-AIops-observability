# Secure AIOps Observability – API Contract

## 1. Project Overview

This document defines the common data format used by the Collector, Backend, AI Engine and Frontend modules.

## 2. Telemetry Data Format

The Collector sends telemetry to the Backend using JSON.

```json
{
  "payload_id": "P1001",
  "collector_id": "COL_001",
  "timestamp": "2026-11-20T09:30:00Z",
  "source_timezone": "Asia/Kolkata",
  "source_id": "SERVER_01",
  "metrics": {
    "cpu": 96,
    "memory": 85,
    "disk": 70,
    "network_latency": 120
  },
  "health_status": "CRITICAL",
  "events": []
}
```

## 3. Backend Responsibilities

- Receive telemetry.
- Authenticate collectors.
- Validate incoming data.
- Prevent duplicate payloads.
- Store telemetry securely.
- Provide APIs to the frontend and AI engine.

## 4. AI Engine Responsibilities

- Detect abnormal CPU and memory usage.
- Identify unusual network activity.
- Correlate related events.
- Predict possible root causes.
- Generate recommendations.

## 5. Frontend Responsibilities

Display:

- System health.
- CPU and memory usage.
- Network status.
- Active alerts.
- AI recommendations.
- Collector status.
- Data egress audit information.

## 6. Security Requirements

- Never send raw logs or passwords to the SaaS backend.
- Redact sensitive information locally.
- Authenticate collectors.
- Encrypt communication.
- Enforce tenant isolation.
- Record metadata about outgoing payloads.

## 7. Important Rule

All four modules must follow this shared data contract. Changes to the contract must be discussed with the team before implementation.