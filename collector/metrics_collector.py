import random
from datetime import datetime, timezone
from typing import List, Dict, Any
import psutil


class MetricsCollector:
    def __init__(self, hostname: str = "prod-db-server-01", source_timezone: str = "Asia/Kolkata"):
        self.hostname = hostname
        self.source_timezone = source_timezone
        self._inject_fault_mode = False

    def set_fault_simulation(self, enabled: bool):
        self._inject_fault_mode = enabled

    def collect_batch(self) -> List[Dict[str, Any]]:
        now_utc = datetime.now(timezone.utc).isoformat()

        # Real host telemetry via psutil (with optional demo spike injection)
        cpu = psutil.cpu_percent(interval=0.2)
        mem = psutil.virtual_memory().percent
        disk = psutil.disk_usage("/").percent if psutil.disk_partitions() else 45.0
        net_io = psutil.net_io_counters()
        bandwidth_mbps = round((net_io.bytes_sent + net_io.bytes_recv) / (1024 * 1024) % 500, 2)

        if self._inject_fault_mode:
            cpu = round(random.uniform(93.5, 99.1), 2)
            latency_ms = round(random.uniform(540.0, 820.0), 2)
            packet_loss = round(random.uniform(5.5, 9.2), 2)
            failed_logins = random.randint(16, 25)
        else:
            latency_ms = round(random.uniform(18.0, 65.0), 2)
            packet_loss = round(random.uniform(0.0, 0.5), 2)
            failed_logins = random.choice([0, 0, 1, 2])

        # Raw events containing sensitive internal IPs, emails, and secrets that MUST NOT leave Tier 1
        raw_events = [
            {
                "event_timestamp_utc": now_utc,
                "source_timezone": self.source_timezone,
                "raw_host": self.hostname,
                "internal_ip": "10.24.18.42",
                "category": "infrastructure",
                "metric_name": "cpu_usage",
                "metric_value": cpu,
                "unit": "percent",
                "raw_log": f"systemd[1]: CPU load {cpu}% on {self.hostname} (10.24.18.42) admin=ops@corp.internal token=sk_live_99887766",
            },
            {
                "event_timestamp_utc": now_utc,
                "source_timezone": self.source_timezone,
                "raw_host": self.hostname,
                "internal_ip": "10.24.18.42",
                "category": "infrastructure",
                "metric_name": "memory_usage",
                "metric_value": mem,
                "unit": "percent",
                "raw_log": f"kernel: memory utilization at {mem}% for db_user=root password=SuperSecretDBPass123!",
            },
            {
                "event_timestamp_utc": now_utc,
                "source_timezone": self.source_timezone,
                "raw_host": self.hostname,
                "internal_ip": "10.24.18.42",
                "category": "infrastructure",
                "metric_name": "disk_usage",
                "metric_value": disk,
                "unit": "percent",
                "raw_log": f"storage-agent: /var/lib/postgresql usage {disk}%",
            },
            {
                "event_timestamp_utc": now_utc,
                "source_timezone": self.source_timezone,
                "raw_host": self.hostname,
                "internal_ip": "10.24.18.42",
                "category": "network",
                "metric_name": "latency_ms",
                "metric_value": latency_ms,
                "unit": "ms",
                "raw_log": f"netflow: RTT to upstream gateway 10.24.0.1 measured at {latency_ms}ms",
            },
            {
                "event_timestamp_utc": now_utc,
                "source_timezone": self.source_timezone,
                "raw_host": self.hostname,
                "internal_ip": "10.24.18.42",
                "category": "network",
                "metric_name": "packet_loss",
                "metric_value": packet_loss,
                "unit": "percent",
                "raw_log": f"netflow: interface eth0 packet_loss={packet_loss}% bandwidth={bandwidth_mbps}Mbps",
            },
            {
                "event_timestamp_utc": now_utc,
                "source_timezone": self.source_timezone,
                "raw_host": self.hostname,
                "internal_ip": "10.24.18.42",
                "category": "security",
                "metric_name": "failed_auth_count",
                "metric_value": float(failed_logins),
                "unit": "count",
                "raw_log": f"sshd[4412]: Failed password for admin@corp.internal from 192.168.1.105 port 51234 Authorization: Bearer eyJhbGciOiJIUzI1NiJ9",
            },
        ]
        return raw_events

    def get_collector_health(self) -> Dict[str, Any]:
        return {
            "cpu": psutil.cpu_percent(interval=None),
            "memory": psutil.virtual_memory().percent,
            "version": "1.0.0",
        }