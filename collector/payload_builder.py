
import hashlib
import json
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any


class PayloadBuilder:

    def __init__(self, tenant_id: str, region: str, collector_id: str):
        self.tenant_id = tenant_id
        self.region = region
        self.collector_id = collector_id

    def build_payload(
        self,
        sanitized_events: List[Dict[str, Any]],
        collector_health: Dict[str, Any]
    ) -> Dict[str, Any]:

        payload_id = f"pay-{uuid.uuid4().hex}"

        created_at_utc = datetime.now(timezone.utc).isoformat()

        envelope = {
            "payload_id": payload_id,
            "tenant_id": self.tenant_id,
            "region": self.region,
            "collector_id": self.collector_id,
            "sent_at_utc": created_at_utc,
            "collector_metrics": collector_health,
            "events": sanitized_events,
        }

        # Use exactly the same JSON formatting as Tier 2
        canonical = json.dumps(
            envelope,
            sort_keys=True
        )

        checksum = hashlib.sha256(
            canonical.encode("utf-8")
        ).hexdigest()

        envelope["sha256_checksum"] = checksum

        return envelope
