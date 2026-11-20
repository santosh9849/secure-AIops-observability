import json
import sqlite3
from datetime import datetime, timezone
from typing import List, Dict, Any


class EgressAuditLogger:
    def __init__(self, db_path: str = "collector_local.db"):
        self.conn = sqlite3.connect(db_path, check_same_thread=False)
        self.conn.execute("PRAGMA journal_mode=WAL;")
        self._init_schema()

    def _init_schema(self):
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS egress_audit_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                recorded_at_utc TEXT NOT NULL,
                payload_id TEXT NOT NULL,
                sha256_checksum TEXT NOT NULL,
                delivery_status TEXT NOT NULL,
                raw_sample_json TEXT NOT NULL,
                approved_outbound_json TEXT NOT NULL
            )
        """)
        self.conn.commit()

    def record_egress_proof(
        self,
        payload: Dict[str, Any],
        raw_events: List[Dict[str, Any]],
        delivery_status: str,
    ):
        self.conn.execute(
            """
            INSERT INTO egress_audit_log (
                recorded_at_utc, payload_id, sha256_checksum,
                delivery_status, raw_sample_json, approved_outbound_json
            ) VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                datetime.now(timezone.utc).isoformat(),
                payload["payload_id"],
                payload["sha256_checksum"],
                delivery_status,
                json.dumps(raw_events[:2]),  # Sample of raw local data that NEVER left Tier 1
                json.dumps(payload),
            ),
        )
        self.conn.commit()

    def get_recent_proofs(self, limit: int = 10) -> List[Dict[str, Any]]:
        cur = self.conn.execute(
            """
            SELECT recorded_at_utc, payload_id, sha256_checksum, delivery_status,
                   raw_sample_json, approved_outbound_json
            FROM egress_audit_log
            ORDER BY id DESC LIMIT ?
            """,
            (limit,),
        )
        results = []
        for row in cur.fetchall():
            results.append(
                {
                    "recorded_at_utc": row[0],
                    "payload_id": row[1],
                    "sha256_checksum": row[2],
                    "delivery_status": row[3],
                    "local_raw_data_kept_private": json.loads(row[4]),
                    "sanitized_metadata_sent_to_saas": json.loads(row[5]),
                }
            )
        return results