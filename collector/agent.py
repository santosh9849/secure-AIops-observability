import json
import logging
import os
import re
import subprocess
import time
import uuid

from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

import psutil


# Configuration
API_URL = os.getenv(
    "SENTINEL_API_URL",
    "http://127.0.0.1:8000/ingest"
)

API_KEY = os.getenv(
    "COLLECTOR_API_KEY",
    "dev-key-change-me"
)

COLLECTOR_ID = os.getenv("COLLECTOR_ID", "COL_001")
SOURCE_ID = os.getenv("SOURCE_ID", "LOCAL-WINDOWS-01")
INTERVAL = 10

BUFFER = Path(__file__).parent / ".buffer" / "pending.jsonl"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | SENTINEL COLLECTOR | %(message)s"
)


def get_network_metrics():

    try:
        result = subprocess.run(
            ["ping", "-n", "4", "-w", "700", "1.1.1.1"],
            capture_output=True,
            text=True,
            timeout=7
        )

        output = result.stdout + result.stderr

        loss = re.search(
            r"Lost\s*=\s*\d+\s*\((\d+)%\s*loss\)",
            output,
            re.IGNORECASE
        )

        latency = re.search(
            r"Average\s*=\s*(\d+)\s*ms",
            output,
            re.IGNORECASE
        )

        if loss:
            return (
                float(loss.group(1)),
                float(latency.group(1)) if latency else 0.0,
                True
            )

    except (OSError, subprocess.TimeoutExpired):
        pass

    return None, None, False


def health_status(cpu, memory, disk, latency, packet_loss):

    loss = packet_loss if packet_loss is not None else 0

    if cpu >= 90 or memory >= 90 or disk >= 95:
        return "Poor"

    if latency is not None and (latency >= 500 or loss >= 10):
        return "Poor"

    if cpu >= 75 or memory >= 75 or disk >= 85:
        return "Fair"

    if latency is not None and (latency >= 250 or loss >= 2):
        return "Fair"

    if cpu >= 50 or memory >= 50 or disk >= 70:
        return "Good"

    return "Excellent"


def collect(previous_network, previous_time):

    cpu = psutil.cpu_percent(interval=1)

    memory = psutil.virtual_memory().percent

    disk = psutil.disk_usage(
        os.environ.get("SystemDrive", "C:") + "\\"
    ).percent

    current_network = psutil.net_io_counters()
    current_time = time.monotonic()

    elapsed = max(current_time - previous_time, 0.1)

    upload = max(
        current_network.bytes_sent - previous_network.bytes_sent,
        0
    ) / elapsed

    download = max(
        current_network.bytes_recv - previous_network.bytes_recv,
        0
    ) / elapsed

    # Convert bytes/sec to Mbps.
    upload_mbps = upload * 8 / 1_000_000
    download_mbps = download * 8 / 1_000_000

    packet_loss, latency, probe_available = get_network_metrics()

    health = health_status(
        cpu,
        memory,
        disk,
        latency,
        packet_loss
    )

    events = [
        {
            "metric_name": "bandwidth_upload_mbps",
            "metric_value": round(upload_mbps, 4),
            "category": "network",
            "unit": "Mbps"
        },
        {
            "metric_name": "bandwidth_download_mbps",
            "metric_value": round(download_mbps, 4),
            "category": "network",
            "unit": "Mbps"
        },
        {
            "metric_name": "network_probe_available",
            "metric_value": 1 if probe_available else 0,
            "category": "network",
            "unit": "boolean"
        }
    ]

    if packet_loss is not None:
        events.append({
            "metric_name": "packet_loss",
            "metric_value": packet_loss,
            "category": "network",
            "unit": "%"
        })

    payload = {
        "payload_id": str(uuid.uuid4()),
        "collector_id": COLLECTOR_ID,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "source_timezone": (
            datetime.now().astimezone().tzname() or "local"
        ),
        "source_id": SOURCE_ID,
        "metrics": {
            "cpu": round(cpu, 2),
            "memory": round(memory, 2),
            "disk": round(disk, 2),
            "network_latency": round(latency or 0, 2)
        },
        "health_status": health,
        "events": events
    }

    return payload, current_network, current_time


def send(payload):

    request = Request(
        API_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "x-api-key": API_KEY
        },
        method="POST"
    )

    with urlopen(request, timeout=8) as response:
        return json.loads(response.read().decode("utf-8"))


def queue(payload):

    BUFFER.parent.mkdir(parents=True, exist_ok=True)

    with BUFFER.open("a", encoding="utf-8") as file:
        file.write(json.dumps(payload) + "\n")


def flush_buffer():

    if not BUFFER.exists():
        return

    lines = BUFFER.read_text(encoding="utf-8").splitlines()

    remaining = []

    for index, line in enumerate(lines):

        try:
            send(json.loads(line))

        except Exception:
            remaining = lines[index:]
            break

    temporary = BUFFER.with_suffix(".tmp")

    temporary.write_text(
        "\n".join(remaining) + ("\n" if remaining else ""),
        encoding="utf-8"
    )

    temporary.replace(BUFFER)


def main():

    logging.info("Windows collector started")
    logging.info("Monitoring source: %s", SOURCE_ID)

    previous_network = psutil.net_io_counters()
    previous_time = time.monotonic()

    while True:

        cycle_start = time.monotonic()

        try:
            flush_buffer()

            payload, previous_network, previous_time = collect(
                previous_network,
                previous_time
            )

            try:
                result = send(payload)

                logging.info(
                    "CPU %.1f%% | RAM %.1f%% | DISK %.1f%% | "
                    "LATENCY %.1f ms | HEALTH %s | "
                    "AIOps %s | INCIDENTS %d",
                    payload["metrics"]["cpu"],
                    payload["metrics"]["memory"],
                    payload["metrics"]["disk"],
                    payload["metrics"]["network_latency"],
                    payload["health_status"],
                    result.get("aiops_engine", "unknown"),
                    len(result.get("incidents", []))
                )

            except (URLError, TimeoutError, OSError, HTTPError) as error:
                queue(payload)
                logging.warning("Buffered telemetry: %s", error)

        except Exception:
            logging.exception("Collector cycle failed")

        remaining = INTERVAL - (time.monotonic() - cycle_start)
        time.sleep(max(remaining, 0))


if __name__ == "__main__":
    main()