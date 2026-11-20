
import hashlib
import re
from typing import Dict, Any

SECRET_PATTERNS = [
    (
        re.compile(
            r"""(?i)(password|passwd|secret|token|api_key|authorization)\s*[:=]\s*["']?[^\s"']+"""
        ),
        r"\1=[REDACTED]"
    ),
    (
        re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b"),
        "[REDACTED_EMAIL]"
    ),
    (
        re.compile(r"\b(?:\d{1,3}\.){3}\d{1,3}\b"),
        "[REDACTED_IP]"
    ),
]

# Only approved fields can leave the local collector.
ALLOW_LIST_KEYS = {
    "event_id",
    "tenant_id",
    "region",
    "collector_id",
    "event_timestamp_utc",
    "source_timezone",
    "pseudonymous_host",
    "category",
    "metric_name",
    "metric_value",
    "unit",
    "severity",
    "health_state",
    "alert_context",
}


class SecurityFilter:

    def __init__(self, tenant_salt: str = "tenant-salt-2026"):
        self.tenant_salt = tenant_salt

    def pseudonymize_host(self, raw_host: str) -> str:
        digest = hashlib.sha256(
            f"{self.tenant_salt}:{raw_host}".encode("utf-8")
        ).hexdigest()[:12]

        return f"node_{digest}"

    def redact_text(self, value: str) -> str:
        sanitized = value

        for pattern, replacement in SECRET_PATTERNS:
            sanitized = pattern.sub(replacement, sanitized)

        return sanitized

    def filter_and_sanitize(
        self, enriched_event: Dict[str, Any]
    ) -> Dict[str, Any]:

        # Replace the original hostname with a pseudonymous ID.
        raw_host = enriched_event.get("raw_host", "unknown-host")

        enriched_event["pseudonymous_host"] = self.pseudonymize_host(
            str(raw_host)
        )

        # Keep only approved fields.
        sanitized_event = {}

        for key in ALLOW_LIST_KEYS:
            if key in enriched_event and enriched_event[key] is not None:

                value = enriched_event[key]

                if isinstance(value, str):
                    sanitized_event[key] = self.redact_text(value)
                else:
                    sanitized_event[key] = value

        return sanitized_event
