# SentinelOps AI

**Secure AI-powered infrastructure observability prototype**  
**CICADA 2026 | Atria Institute of Technology**

SentinelOps AI is a local-first observability prototype. A Python collector gathers host and network metrics, a FastAPI backend authenticates collector submissions and stores approved telemetry in SQLite, and a separate AIOps service detects anomalies, correlates related signals, and produces incident recommendations.

A React dashboard presents telemetry, infrastructure health, incidents, AI insights, network information, and egress audit records.

> **Prototype scope:** The current hackathon implementation runs locally on one machine using separate collector, backend, AIOps, and frontend processes. It demonstrates the intended two-tier design, but it is **not yet a cloud-deployed SaaS product**. Dashboard-user authentication, HTTPS/TLS deployment, and production-grade tenant authorization are not implemented.

## 1. Problem and Solution

Organizations need visibility into infrastructure health while limiting the operational data that leaves their environment.

Traditional monitoring systems can transfer sensitive logs and detailed telemetry to centralized platforms. They may also generate excessive alerts, making it difficult to identify the actual causes of system failures.

SentinelOps AI demonstrates a local collector and a central analytics layer:

- **Local collection:** Collect CPU, memory, disk, network throughput, latency, and packet-loss information.
- **Backend ingestion:** Validate collector identity, accept telemetry, filter event metadata through an allow-list, and record egress audit information.
- **AIOps analysis:** Apply threshold and statistical detection, Isolation Forest analysis, event correlation, root-cause analysis, severity classification, and recommendation generation.
- **Dashboard:** Display live telemetry, infrastructure health, incidents, network data, AI insights, and audit information.

## 2. Architecture

SentinelOps AI uses a two-tier architecture.

```text
Customer / Local Environment
┌──────────────────────────────────────────────┐
│ Python Collector (collector/agent.py)        │
│ psutil metrics + network probe               │
│ Local retry buffer on connection failure    │
└──────────────────────┬───────────────────────┘
                       │ X-API-Key + JSON telemetry
                       ▼
Central Ingestion / Analytics Layer (local prototype)
┌──────────────────────────────────────────────┐
│ FastAPI Backend :8000                        │
│ Collector validation • Event allow-list      │
│ SQLite telemetry/incidents/egress audit      │
└──────────────────────┬───────────────────────┘
                       │ POST /analyze
                       ▼
┌──────────────────────────────────────────────┐
│ AIOps FastAPI Service :8001                  │
│ Threshold + Statistical + Isolation Forest  │
│ Correlation • Root cause • Severity          │
│ Recommendations                              │
└──────────────────────┬───────────────────────┘
                       │ REST API
                       ▼
┌──────────────────────────────────────────────┐
│ React + Vite Dashboard :5173                 │
│ Dashboard • Infrastructure • Network         │
│ Incidents • AI Insights • Audit • Settings   │
└──────────────────────────────────────────────┘
```

### Data flow

`Collect → Validate → Filter approved event fields → Store → Analyze → Correlate → Recommend → Display`

The backend's event sanitizer reconstructs accepted event objects from approved fields rather than persisting arbitrary input properties. In the demonstrated filter test, an extra `client_email` property was not present in stored telemetry.

## 3. Main Features Implemented

- Host CPU, memory, disk, and network telemetry collection.
- Network latency probe, bandwidth measurements, and packet-loss event support.
- Four health labels: Excellent, Good, Fair, and Poor.
- Collector API-key validation and registered-collector checks.
- Event allow-list filtering and egress audit records.
- SQLite persistence for telemetry, incidents, collectors, and audit information.
- Duplicate-payload handling in ingestion.
- Local collector retry/buffer logic for connection failures.
- AIOps threshold, statistical, and Isolation Forest detection.
- Event correlation, root-cause analysis, severity classification, and recommendations.
- React dashboard pages for Dashboard, Infrastructure, Network, Security, Incidents, AI Insights, Audit Logs, and Settings.

**Current collector scope:** The supplied collector gathers system and network metrics. It does not currently collect arbitrary raw application logs or implement a general-purpose secret-scanning pipeline. The security dashboard should therefore be interpreted in the context of the security-related records actually ingested.

## 4. Technology Stack

| Layer | Technologies |
|---|---|
| Collector | Python, psutil |
| Backend API | Python, FastAPI, Pydantic |
| AIOps Service | Python, FastAPI, NumPy, pandas, scikit-learn |
| Database | SQLite |
| Frontend | React, Vite, React Router, Axios, Recharts, lucide-react |
| Testing | pytest |
| Version Control | Git, GitHub |

## 5. Repository Structure

```text
secure-AIops-observability/
├── aiops/          # AIOps API, detectors, correlation, recommendations and tests
├── backend/        # FastAPI ingestion API, database, models and routes
├── collector/      # Local Python telemetry collector
├── docs/           # Project documentation
├── frontend/       # React + Vite dashboard
├── tests/          # Project-level tests, if present
├── .gitignore
├── LICENSE
└── README.md
```

## 6. Local Setup (Windows PowerShell)

Run commands from the repository root unless a `cd` command is shown. The prototype uses separate Python environments for the backend/collector and AIOps service.

### 6.1 Backend and Collector Environment

```powershell
py -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r backend\requirements.txt
pip install -r collector\requirements.txt
```

If PowerShell blocks environment activation, use the Python environment activation method already configured on your machine, or run the environment's `python.exe` directly.

### 6.2 AIOps Environment

Open a separate PowerShell terminal:

```powershell
cd aiops
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### 6.3 Frontend Dependencies

Open another terminal:

```powershell
cd frontend
npm install
```

## 7. Start the Four Processes

Keep each process running in its own terminal. Start AIOps first, then the backend, the frontend, and finally the collector.

### Terminal 1 — AIOps Service

```powershell
cd aiops
.\.venv\Scripts\Activate.ps1
uvicorn main:app --host 127.0.0.1 --port 8001
```

Health check: `http://127.0.0.1:8001/health`

### Terminal 2 — Backend Service

From the repository root:

```powershell
.\venv\Scripts\Activate.ps1
cd backend
uvicorn main:app --host 127.0.0.1 --port 8000
```

Health check: `http://127.0.0.1:8000/health`  
Interactive API docs: `http://127.0.0.1:8000/docs`

The SQLite database is managed by the backend and is created locally when the backend initializes.

### Terminal 3 — Frontend

```powershell
cd frontend
npm run dev -- --host 127.0.0.1
```

Open: `http://127.0.0.1:5173`

### Terminal 4 — Collector

From the repository root, with the root `venv` activated:

```powershell
python collector/agent.py
```

The collector's current local-demo configuration targets the backend at `127.0.0.1:8000` and uses the registered demo collector configuration. Do not reuse development credentials for a public or production deployment.

## 8. API Overview

### Backend (`http://127.0.0.1:8000`)

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Backend health check |
| POST | `/ingest` | Receive authenticated collector telemetry (`X-API-Key`) |
| GET | `/latest` | Latest telemetry records |
| GET | `/history/{source_id}` | Telemetry history for a source |
| GET | `/collectors` | Registered/recent collectors |
| GET | `/incidents` | Retrieve incidents |
| POST | `/incidents` | Create an incident record |
| PATCH | `/incidents/{incident_id}` | Update incident status |
| GET | `/audit-logs` | Retrieve egress audit records |

### AIOps (`http://127.0.0.1:8001`)

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | AIOps service health check |
| POST | `/analyze` | Analyze a telemetry batch and return detection/correlation results |

The backend and AIOps interactive API documentation are available at `/docs` on their respective ports when enabled by the FastAPI application.

## 9. Event Allow-list

The backend currently recognizes these event names:

| Event name | Expected unit | Accepted range |
|---|---|---|
| `bandwidth_upload_mbps` | Mbps | 0 or greater |
| `bandwidth_download_mbps` | Mbps | 0 or greater |
| `packet_loss` | % | 0–100 |
| `network_probe_available` | Boolean | 0–1 |

Each event uses `metric_name` and `metric_value`. The sanitizer builds a new approved event containing the allowed metric name/value, category, and unit; arbitrary extra properties are not carried into the stored event.

Example event:

```json
{
  "metric_name": "bandwidth_upload_mbps",
  "metric_value": 2.5,
  "category": "network",
  "unit": "Mbps"
}
```

## 10. Security and Prototype Limitations

The following controls were exercised in the local prototype:

- Invalid collector API key returned **HTTP 401**.
- Correct key with an unregistered collector returned **HTTP 403**.
- Allow-listed event fields were accepted, and an extra test email property was not found in stored telemetry.
- Egress audit records capture the approved field list and filtering decision/counts.

The following are **not yet production-ready or not implemented**:

- Dashboard login is a local demo entry, not real user authentication or authorization.
- The prototype is bound to localhost for the documented demo; there is no production HTTPS/TLS termination or cloud deployment configuration.
- Tenant-aware data structures exist, but complete authenticated tenant isolation across every dashboard/API route has not been established. The current dashboard uses the demo tenant context.
- The current collector does not ingest arbitrary application logs or automatically discover all secret/PII patterns.
- Performance targets and zero-loss/zero-duplicate behaviour during prolonged outages have not been comprehensively benchmarked.
- Automated remediation is not implemented; recommendations are advisory and require human action.

Use the supplied development configuration only for a local demonstration. Before any shared or public deployment, move credentials to environment-based secret management, rotate demo keys, add dashboard authentication/authorization, enforce tenant context, enable TLS, and review network exposure and database access.

## 11. Verification Already Performed

The following results were observed during local development:

- Frontend production build completed successfully with Vite. Vite emitted a non-blocking large-chunk warning.
- AIOps unit tests: **31 passed** in the recorded test run.
- Backend and AIOps health endpoints returned HTTP 200.
- Collector telemetry successfully reached the backend and invoked the AIOps `/analyze` endpoint.
- The invalid-key and unknown-collector tests returned HTTP 401 and HTTP 403 respectively.
- The event-filter test accepted two approved events and did not persist the extra `client_email` property.

These are development verification results, not a formal security audit or production certification.

## 12. Suggested 4-Minute Demonstration

1. **Architecture (30 seconds):** Explain the local collector, ingestion backend, AIOps service, and React dashboard.
2. **Live telemetry (45 seconds):** Show Dashboard and Infrastructure while the collector reports CPU, memory, disk, and network data.
3. **Network monitoring (30 seconds):** Show latency, bandwidth, and packet-loss information.
4. **AI incident analysis (60 seconds):** Open Incidents and AI Insights. Explain detection, event correlation, root-cause context, severity, and recommended actions.
5. **Privacy/security (60 seconds):** Explain the event allow-list and egress audit. Show the recorded test results: wrong key → 401, unknown collector → 403, and the extra email property absent from stored telemetry.
6. **Honest scope (15 seconds):** State that the current demonstrator is local, with dashboard authentication and cloud deployment as remaining production work.

## 13. Project Information

- **Project:** SentinelOps AI
- **Event:** CICADA 2026 — 24-hour hackathon
- **Institution:** Atria Institute of Technology
- **Repository:** https://github.com/santosh9849/secure-AIops-observability
- **Integration branch:** `integration`

---

*SentinelOps AI — Observe locally. Protect data. Detect intelligently. Recommend responsibly.*