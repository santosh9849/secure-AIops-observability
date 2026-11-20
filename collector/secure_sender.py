
import httpx
from typing import Dict, Any, Tuple


class SecureSender:
    def __init__(
        self,
        saas_ingest_url: str = "http://127.0.0.1:8000/api/telemetry/ingest",
        collector_token: str = "col-secret-token-2026",
        tenant_id: str = "tenant_eu_01",
        region: str = "eu-central",
    ):
        self.saas_ingest_url = saas_ingest_url
        self.collector_token = collector_token
        self.tenant_id = tenant_id
        self.region = region

    def send_payload(
        self, payload: Dict[str, Any]
    ) -> Tuple[bool, str]:

        headers = {
            "Authorization": f"Bearer {self.collector_token}",
            "X-Tenant-ID": self.tenant_id,
            "X-Region": self.region,
            "X-Payload-ID": payload["payload_id"],
            "Content-Type": "application/json",
        }

        try:
            with httpx.Client(timeout=10.0) as client:
                response = client.post(
                    self.saas_ingest_url,
                    json=payload,
                    headers=headers
                )

                if response.status_code in (200, 201, 202):
                    return True, f"HTTP {response.status_code}"

                return False, (
                    f"HTTP {response.status_code}: {response.text[:500]}"
                )

        except httpx.RequestError as exc:
            return False, f"Connection error: {exc}"

        except Exception as exc:
            return False, f"Unexpected error: {exc}"
