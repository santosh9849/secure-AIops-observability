# SentinelOps AI

### Secure AI-Powered Observability Platform

**CICADA 2026 – 24-Hour Hackathon**

A secure, AI-powered observability platform that monitors enterprise infrastructure, applications, networks and security events while keeping sensitive operational data inside the customer's environment.

---

## 1. Problem Statement

Organizations need to monitor distributed infrastructure, applications, networks and security events without exposing sensitive operational data outside their environments.

Traditional monitoring approaches can create security risks when raw logs, credentials, payloads and detailed telemetry are transferred to centralized platforms. Organizations also struggle with alert fatigue, operational blind spots and identifying the root causes of system failures.

**Our Solution:**

SentinelOps AI introduces a two-tier observability architecture consisting of a local collector and a centralized SaaS platform.

The local collector gathers and processes telemetry, filters sensitive information, redacts secrets and sends only approved metadata to the centralized platform.

The SaaS platform uses AIOps techniques to detect anomalies, correlate incidents and generate explainable operational recommendations.

## 2. Project Objectives

- Protect sensitive operational data through local processing.
- Monitor infrastructure, applications, networks and security events.
- Detect anomalies using historical baselines and statistical techniques.
- Reduce alert fatigue through event correlation.
- Provide explainable recommendations for system administrators.
- Support multiple collectors and customer environments.
- Maintain reliable data delivery during network outages.
- Provide a centralized real-time observability dashboard.

## 3. System Architecture

SentinelOps AI follows a two-tier architecture.

### Tier 1: Local Collector (Customer Environment)

Responsible for collecting and processing telemetry locally.

Responsibilities:
- Collect CPU, memory and disk metrics.
- Monitor network latency and packet loss.
- Process application and security events.
- Filter and normalize telemetry.
- Redact sensitive information.
- Apply metadata allow-list policies.
- Perform local analysis.
- Maintain an egress proof log.
- Buffer approved metadata during SaaS outages.

### Tier 2: Central SaaS Platform

Responsible for centralized monitoring and intelligence.

Responsibilities:
- Receive approved metadata securely.
- Authenticate collectors.
- Enforce tenant-level data separation.
- Store telemetry and incident records.
- Detect anomalies.
- Correlate related alerts.
- Generate explainable recommendations.
- Provide real-time dashboards and alerts.

### Data Flow

**Collect → Filter → Redact → Aggregate → Analyze Locally → Apply Data Policy → Transmit Metadata → SaaS Analytics → Dashboard and Recommendations**

Raw logs, passwords, tokens and sensitive information remain local by default.

## 4. Key Features

| Feature | Description |
|---|---|
| Local Telemetry Collector | Collects infrastructure and network metrics |
| Privacy Engine | Filters and redacts sensitive information |
| Metadata-Only Transmission | Sends approved fields to SaaS |
| Egress Proof Panel | Shows exactly what payload is transmitted |
| Real-Time Dashboard | Displays infrastructure health |
| Four Health States | Excellent, Good, Fair and Poor |
| Anomaly Detection | Identifies unusual system behaviour |
| Alert Correlation | Combines related alerts into incidents |
| AI Recommendations | Suggests possible causes and solutions |
| Local Buffering | Stores metadata during connectivity outages |
| Multi-Tenant Support | Separates customer environments |

## 5. Technology Stack

| Component | Technology |
|---|---|
| Frontend | React.js, Vite |
| Backend | Node.js, Express.js |
| Collector | Python |
| Database | MongoDB |
| Real-Time Communication | Socket.IO |
| Analytics | Python, NumPy |
| Authentication | JWT |
| Local Buffering | SQLite |
| Version Control | Git and GitHub |

## 6. Repository Structure

```text
secure-AIops-observability/
│
├── aiops/
│   └── AIOps anomaly detection and recommendations
│
├── backend/
│   └── Node.js APIs and MongoDB integration
│
├── collector/
│   └── Python local telemetry collector
│
├── docs/
│   └── Architecture and API documentation
│
├── frontend/
│   └── React monitoring dashboard
│
├── tests/
│   └── Integration and performance testing
│
├── LICENSE
└── README.md
```

## 7. Team Responsibilities

The project is divided into four independent development modules.

### Member 1 – Local Collector Engineer

**Git Branch:** `collector`

**Working Directory:** `collector/`

Responsibilities:
- Develop the Python telemetry collector.
- Collect CPU, memory and disk usage.
- Monitor network latency and packet loss.
- Process application and security logs.
- Integrate simulated telemetry.
- Implement local buffering and retry mechanisms.
- Ensure telemetry is processed locally.

**Expected Deliverable:** A working Python collector that gathers and processes telemetry inside the customer environment.

### Member 2 – Backend and Security Engineer

**Git Branch:** `backend`

**Working Directory:** `backend/`

Responsibilities:
- Develop Node.js and Express APIs.
- Integrate MongoDB.
- Implement user and collector authentication.
- Implement tenant-level data isolation.
- Validate incoming metadata against the allow-list.
- Store telemetry and incident records.
- Implement duplicate payload prevention.
- Maintain egress audit records.

**Expected Deliverable:** A secure backend supporting metadata ingestion, authentication and multi-tenant storage.

### Member 3 – Frontend Engineer

**Git Branch:** `frontend`

**Working Directory:** `frontend/`

Responsibilities:
- Develop the React monitoring dashboard.
- Display CPU, memory and disk usage.
- Display network metrics.
- Implement four system health states.
- Display collector online/offline status.
- Develop incidents and alerts pages.
- Display egress proof information.
- Integrate real-time updates.

**Expected Deliverable:** A responsive monitoring dashboard displaying real telemetry, system health and incidents.

### Member 4 – AIOps Engineer

**Git Branch:** `aiops`

**Working Directory:** `aiops/`

Responsibilities:
- Develop anomaly detection algorithms.
- Establish historical metric baselines.
- Implement statistical anomaly detection.
- Develop event correlation.
- Reduce duplicate and noisy alerts.
- Generate explainable recommendations.
- Display contributing signals and confidence scores.
- Integrate AIOps results with the backend and dashboard.

**Expected Deliverable:** An intelligent analytics engine capable of detecting anomalies, correlating incidents and recommending actions.

### Shared Responsibilities

All four members are responsible for:
- Following secure coding practices.
- Maintaining code documentation.
- Testing their modules.
- Participating in integration.
- Reviewing pull requests.
- Preparing the final demonstration.

## 8. GitHub Branch Strategy

The project uses separate development branches to support parallel development.

| Branch | Purpose |
|---|---|
| `main` | Stable integrated project |
| `collector` | Python telemetry collector |
| `backend` | Backend and security |
| `frontend` | Monitoring dashboard |
| `aiops` | Anomaly detection and recommendations |

### Collaboration Workflow

1. Each member works on their assigned branch.
2. Pull the latest changes before starting development.
3. Commit changes with meaningful messages.
4. Push completed work to the respective branch.
5. Create a Pull Request to merge changes into `main`.
6. Review and test changes before merging.
7. Keep `main` stable and functional.

## 9. Data Privacy and Security

### Data That Stays Local

- Raw application logs.
- Passwords and authentication tokens.
- API keys and secrets.
- Personal information.
- Sensitive request payloads.

### Data That Is Redacted

- Email addresses.
- Credentials.
- Sensitive identifiers.
- Other policy-defined confidential fields.

### Approved Metadata Sent to SaaS

- CPU usage.
- Memory usage.
- Disk usage.
- Network latency.
- Packet loss.
- UTC timestamps.
- Pseudonymous source identifiers.
- Health states.
- Event categories and severity.
- Aggregated security indicators.

Only explicitly allow-listed fields are permitted to leave the local environment.

## 10. Four System Health States

| State | Meaning |
|---|---|
| Excellent | System is healthy and operating within expected baselines |
| Good | Minor deviations without significant service impact |
| Fair | System needs attention due to elevated metrics or warnings |
| Poor | Critical condition, collector unavailable or severe degradation |

Health thresholds will be configurable, and stale or missing data will be handled explicitly.

## 11. AIOps Workflow

SentinelOps AI follows these stages:

1. **Observe:** Collect and visualize infrastructure metrics.
2. **Detect:** Identify unusual behaviour and anomalies.
3. **Correlate:** Group related events into incidents.
4. **Recommend:** Suggest likely causes and corrective actions.
5. **Act (Future):** Support approved and policy-controlled remediation.

Automated remediation will initially be simulated or restricted to a safe test environment.

## 12. 24-Hour Development Plan

| Timeline | Activities |
|---|---|
| Hours 0–2 | Planning, architecture and team setup |
| Hours 2–6 | Collector and privacy engine |
| Hours 6–11 | Backend and dashboard development |
| Hours 11–15 | Anomaly detection and correlation |
| Hours 15–19 | Security, buffering and reliability |
| Hours 19–22 | Integration and testing |
| Hours 22–24 | Final demonstration and presentation |

## 13. Performance Targets

The prototype will be evaluated against the following suggested targets from the hackathon guide.

| Measurement | Target |
|---|---|
| Collection to dashboard | Within 10 seconds at P95 |
| Threshold breach to alert | Within 15 seconds |
| Collector offline detection | Within 60 seconds |
| Post-outage delivery | Zero loss and zero duplicates |

Performance will be measured using event timestamps and payload identifiers.

## 14. Live Demonstration Scenarios

The final demonstration will cover:

1. Raw log containing a secret: prove that sensitive content stays local.
2. Collector loses SaaS connectivity: demonstrate buffering and retry.
3. Repeated failed logins: generate a security risk indicator.
4. Network latency rises: identify the affected source and severity.
5. CPU or memory deviates from baseline: detect the anomaly and recommend investigation.
6. Multiple alerts relate to one incident: demonstrate event correlation.

## 15. Future Enhancements

- Advanced machine learning anomaly detection.
- Regional ingestion endpoints.
- Advanced tenant data residency controls.
- Global infrastructure monitoring.
- Policy-controlled autonomous remediation.
- Automated incident response with approval and rollback.

## 16. Project Information

**Project Name:** SentinelOps AI

**Hackathon:** CICADA 2026

**Event Duration:** 24 Hours

**Organized By:** TechForcz × Atria Institute of Technology

**Project Category:** Secure AIOps Observability

**Development Team:** 4 Members

**Repository:** https://github.com/santosh9849/secure-AIops-observability

---

*SentinelOps AI – Observe Locally. Protect Data. Detect Intelligently. Recommend Confidently.*