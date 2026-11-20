
# SentinelOps AI - Collector Module

## Overview

The Collector module collects infrastructure
metrics and sends approved telemetry to the
SentinelOps backend.

## Features

1. CPU monitoring
2. Memory monitoring
3. Disk monitoring
4. Network monitoring
5. Event processing
6. Privacy filtering
7. Data policy enforcement
8. SQLite buffering
9. Backend communication
10. Egress auditing

## Installation

Create virtual environment:

```bash
python -m venv .venv
```

Activate on Windows:

```powershell
.\.venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -r requirements.txt
```

## Configuration

Set backend URL:

```powershell
$env:SENTINELOPS_BACKEND_URL="http://127.0.0.1:8000/api/v1/telemetry"
```

## Run Collector

```bash
python main.py
```

## Data Privacy

- Raw logs are not uploaded.
- Sensitive fields are filtered.
- Only approved metadata is transmitted.
- Failed transmissions are buffered locally.
- Egress metadata is audited.

## Integration

The Collector follows the team's shared
data contract.

Discuss changes with all team members
before modifying the contract.