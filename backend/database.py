import json
import sqlite3
from pathlib import Path

# The database file is created next to this script. *.db is in .gitignore.
DB_PATH = Path(__file__).parent / "sentinel.db"


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # lets us read columns by name
    return conn


def init_db():
    """Create the table if it doesn't exist yet. Runs once at startup."""
    conn = get_connection()
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS telemetry (
            payload_id      TEXT PRIMARY KEY,   -- PRIMARY KEY = duplicates impossible
            collector_id    TEXT NOT NULL,
            source_id       TEXT NOT NULL,
            event_time      TEXT NOT NULL,      -- when it happened (UTC)
            received_at     TEXT NOT NULL,      -- when we got it (UTC)
            source_timezone TEXT,
            cpu             REAL,
            memory          REAL,
            disk            REAL,
            network_latency REAL,
            health_status   TEXT,
            events_json     TEXT
        )
        """
    )
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_source_time ON telemetry (source_id, event_time)"
    )
    conn.commit()
    conn.close()


def insert_payload(row: dict) -> bool:
    """Save one payload. Returns True if new, False if it was a duplicate."""
    conn = get_connection()
    cur = conn.execute(
        """
        INSERT OR IGNORE INTO telemetry
        (payload_id, collector_id, source_id, event_time, received_at,
         source_timezone, cpu, memory, disk, network_latency,
         health_status, events_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            row["payload_id"], row["collector_id"], row["source_id"],
            row["event_time"], row["received_at"], row["source_timezone"],
            row["cpu"], row["memory"], row["disk"], row["network_latency"],
            row["health_status"], json.dumps(row["events"]),
        ),
    )
    conn.commit()
    inserted = cur.rowcount == 1  # 0 means the payload_id already existed
    conn.close()
    return inserted


def _row_to_dict(r) -> dict:
    d = dict(r)
    d["events"] = json.loads(d.pop("events_json") or "[]")
    return d


def get_latest_per_source() -> list[dict]:
    """Newest reading (by EVENT time, not arrival time) for each source."""
    conn = get_connection()
    rows = conn.execute(
        """
        SELECT t.* FROM telemetry t
        JOIN (SELECT source_id, MAX(event_time) AS max_time
              FROM telemetry GROUP BY source_id) m
          ON t.source_id = m.source_id AND t.event_time = m.max_time
        """
    ).fetchall()
    conn.close()
    return [_row_to_dict(r) for r in rows]


def get_history(source_id: str, limit: int = 100) -> list[dict]:
    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM telemetry WHERE source_id = ? ORDER BY event_time DESC LIMIT ?",
        (source_id, limit),
    ).fetchall()
    conn.close()
    return [_row_to_dict(r) for r in rows]


def get_collectors() -> list[dict]:
    """Last-seen time per collector (used for online/offline status)."""
    conn = get_connection()
    rows = conn.execute(
        """
        SELECT collector_id, MAX(received_at) AS last_seen, COUNT(*) AS payload_count
        FROM telemetry GROUP BY collector_id
        """
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]
