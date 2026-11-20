import json
import sqlite3
from typing import List, Tuple, Dict, Any


class LocalBuffer:
    def __init__(self, db_path: str = "collector_local.db"):
        self.conn = sqlite3.connect(db_path, check_same_thread=False)
        self.conn.execute("PRAGMA journal_mode=WAL;")
        self._init_schema()

    def _init_schema(self):
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS raw_vault (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_timestamp_utc TEXT NOT NULL,
                raw_json TEXT NOT NULL
            )
        """)
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS egress_queue (
                payload_id TEXT PRIMARY KEY,
                created_at_utc TEXT NOT NULL,
                payload_json TEXT NOT NULL,
                status TEXT DEFAULT 'PENDING',
                attempts INTEGER DEFAULT 0
            )
        """)
        self.conn.commit()

    def save_raw_events(self, raw_events: List[Dict[str, Any]]):
        for evt in raw_events:
            self.conn.execute(
                "INSERT INTO raw_vault (event_timestamp_utc, raw_json) VALUES (?, ?)",
                (evt["event_timestamp_utc"], json.dumps(evt)),
            )
        # Keep only the latest 1,000 raw records locally (local retention policy)
        self.conn.execute("""
            DELETE FROM raw_vault WHERE id NOT IN (
                SELECT id FROM raw_vault ORDER BY id DESC LIMIT 1000
            )
        """)
        self.conn.commit()

    def enqueue_payload(self, payload: Dict[str, Any]):
        self.conn.execute(
            "INSERT OR IGNORE INTO egress_queue (payload_id, created_at_utc, payload_json) VALUES (?, ?, ?)",
            (payload["payload_id"], payload["sent_at_utc"], json.dumps(payload)),
        )
        self.conn.commit()

    def get_pending_payloads(self, limit: int = 25) -> List[Tuple[str, Dict[str, Any]]]:
        cur = self.conn.execute(
            "SELECT payload_id, payload_json FROM egress_queue WHERE status = 'PENDING' ORDER BY created_at_utc ASC LIMIT ?",
            (limit,),
        )
        return [(row[0], json.loads(row[1])) for row in cur.fetchall()]

    def mark_sent(self, payload_id: str):
        self.conn.execute(
            "UPDATE egress_queue SET status = 'SENT', attempts = attempts + 1 WHERE payload_id = ?",
            (payload_id,),
        )
        self.conn.commit()

    def increment_attempt(self, payload_id: str):
        self.conn.execute(
            "UPDATE egress_queue SET attempts = attempts + 1 WHERE payload_id = ?",
            (payload_id,),
        )
        self.conn.commit()

    def get_queue_stats(self) -> Dict[str, int]:
        pending = self.conn.execute("SELECT COUNT(*) FROM egress_queue WHERE status = 'PENDING'").fetchone()[0]
        sent = self.conn.execute("SELECT COUNT(*) FROM egress_queue WHERE status = 'SENT'").fetchone()[0]
        raw_count = self.conn.execute("SELECT COUNT(*) FROM raw_vault").fetchone()[0]
        return {"pending_payloads": pending, "sent_payloads": sent, "local_raw_records": raw_count}