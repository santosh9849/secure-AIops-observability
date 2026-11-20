
import hashlib
import json
import os
import shutil
import sqlite3
import uuid

from datetime import datetime, timezone
from pathlib import Path


DB_PATH = Path(__file__).parent / "sentinel.db"


def now_utc():
    return datetime.now(timezone.utc).isoformat()


def get_connection():
    conn = sqlite3.connect(DB_PATH, timeout=10)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def _table_exists(conn, table_name):
    result = conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
        (table_name,)
    ).fetchone()
    return result is not None


def init_db():
    """Initialize and safely extend the existing SQLite database."""

    # Back up the existing database before its first schema migration.
    if DB_PATH.exists():
        backup_path = DB_PATH.with_name("sentinel_pre_tenant_backup.db")
        if not backup_path.exists():
            shutil.copy2(DB_PATH, backup_path)

    conn = get_connection()

    try:
        # 1. Tenants
        conn.execute("""
            CREATE TABLE IF NOT EXISTS tenants (
                tenant_id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                region TEXT NOT NULL DEFAULT 'local',
                created_at TEXT NOT NULL
            )
        """)

        conn.execute("""
            INSERT OR IGNORE INTO tenants
            (tenant_id, name, region, created_at)
            VALUES (?, ?, ?, ?)
        """, ("demo", "Demo Organization", "local", now_utc()))

        # 2. Existing telemetry table
        if not _table_exists(conn, "telemetry"):
            conn.execute("""
                CREATE TABLE telemetry (
                    payload_id TEXT PRIMARY KEY,
                    tenant_id TEXT NOT NULL DEFAULT 'demo',
                    collector_id TEXT NOT NULL,
                    source_id TEXT NOT NULL,
                    event_time TEXT NOT NULL,
                    received_at TEXT NOT NULL,
                    source_timezone TEXT,
                    cpu REAL,
                    memory REAL,
                    disk REAL,
                    network_latency REAL,
                    health_status TEXT,
                    events_json TEXT
                )
            """)
        else:
            columns = {
                row["name"]
                for row in conn.execute(
                    "PRAGMA table_info(telemetry)"
                ).fetchall()
            }

            # Migrate existing records without deleting them.
            if "tenant_id" not in columns:
                conn.execute("""
                    ALTER TABLE telemetry
                    ADD COLUMN tenant_id TEXT NOT NULL DEFAULT 'demo'
                """)

        conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_tenant_source_time
            ON telemetry (tenant_id, source_id, event_time)
        """)

        # 3. Collectors
        conn.execute("""
            CREATE TABLE IF NOT EXISTS collectors (
                tenant_id TEXT NOT NULL,
                collector_id TEXT NOT NULL,
                name TEXT,
                api_key_hash TEXT UNIQUE,
                status TEXT NOT NULL DEFAULT 'registered',
                last_seen TEXT,
                payload_count INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                PRIMARY KEY (tenant_id, collector_id),
                FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id)
            )
        """)

        # Preserve collector information from existing telemetry.
        conn.execute("""
            INSERT OR IGNORE INTO collectors
            (tenant_id, collector_id, name, last_seen,
             payload_count, created_at)
            SELECT tenant_id, collector_id, collector_id,
                   MAX(received_at), COUNT(*), ?
            FROM telemetry
            GROUP BY tenant_id, collector_id
        """, (now_utc(),))

        # Register the local demo collector credential by hash.
        default_key = os.getenv(
            "COLLECTOR_API_KEY", "dev-key-change-me"
        )

        key_hash = hashlib.sha256(
            default_key.encode("utf-8")
        ).hexdigest()

        conn.execute("""
            INSERT INTO collectors
            (tenant_id, collector_id, name, api_key_hash,
             status, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(tenant_id, collector_id)
            DO UPDATE SET api_key_hash = excluded.api_key_hash
        """, (
            "demo", "COL_001", "Demo Collector",
            key_hash, "registered", now_utc()
        ))

        # 4. Incidents
        conn.execute("""
            CREATE TABLE IF NOT EXISTS incidents (
                incident_id TEXT PRIMARY KEY,
                tenant_id TEXT NOT NULL,
                source_id TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                severity TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'open',
                probable_cause TEXT,
                recommendation TEXT,
                confidence REAL,
                first_seen TEXT NOT NULL,
                last_seen TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id)
            )
        """)

        conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_incident_tenant_status
            ON incidents (tenant_id, status)
        """)

        # 5. Egress audit
        conn.execute("""
            CREATE TABLE IF NOT EXISTS egress_audit (
                audit_id TEXT PRIMARY KEY,
                tenant_id TEXT NOT NULL,
                collector_id TEXT NOT NULL,
                payload_id TEXT NOT NULL,
                destination TEXT,
                approved_fields_json TEXT NOT NULL,
                redacted_count INTEGER NOT NULL DEFAULT 0,
                rejected_count INTEGER NOT NULL DEFAULT 0,
                decision TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id)
            )
        """)

        conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_egress_tenant_time
            ON egress_audit (tenant_id, created_at)
        """)

        conn.commit()

    except Exception:
        conn.rollback()
        raise

    finally:
        conn.close()


# ---------------------------------
# TENANT OPERATIONS
# ---------------------------------

def create_tenant(tenant_id, name, region="local"):
    conn = get_connection()
    try:
        conn.execute("""
            INSERT INTO tenants
            (tenant_id, name, region, created_at)
            VALUES (?, ?, ?, ?)
        """, (tenant_id, name, region, now_utc()))
        conn.commit()
    finally:
        conn.close()


def get_tenants():
    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT tenant_id, name, region, created_at FROM tenants"
        ).fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()


# ---------------------------------
# COLLECTOR OPERATIONS
# ---------------------------------

def register_collector(tenant_id, collector_id, api_key, name=None):
    if not api_key:
        raise ValueError("Collector API key is required")

    key_hash = hashlib.sha256(
        api_key.encode("utf-8")
    ).hexdigest()

    conn = get_connection()
    try:
        conn.execute("""
            INSERT INTO collectors
            (tenant_id, collector_id, name, api_key_hash,
             created_at)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(tenant_id, collector_id)
            DO UPDATE SET
                name = excluded.name,
                api_key_hash = excluded.api_key_hash
        """, (
            tenant_id,
            collector_id,
            name or collector_id,
            key_hash,
            now_utc()
        ))
        conn.commit()
    finally:
        conn.close()


def get_collector_by_api_key(api_key):
    key_hash = hashlib.sha256(
        api_key.encode("utf-8")
    ).hexdigest()

    conn = get_connection()
    try:
        row = conn.execute("""
            SELECT tenant_id, collector_id, name, status
            FROM collectors
            WHERE api_key_hash = ?
        """, (key_hash,)).fetchone()

        return dict(row) if row else None
    finally:
        conn.close()


def get_collectors(tenant_id="demo"):
    conn = get_connection()
    try:
        rows = conn.execute("""
            SELECT collector_id, last_seen, payload_count, status
            FROM collectors
            WHERE tenant_id = ?
            ORDER BY collector_id
        """, (tenant_id,)).fetchall()

        return [dict(row) for row in rows]
    finally:
        conn.close()


# ---------------------------------
# TELEMETRY OPERATIONS
# ---------------------------------

def insert_payload(row: dict) -> bool:
    """Insert telemetry and update its collector summary."""

    tenant_id = row.get("tenant_id", "demo")
    conn = get_connection()

    try:
        cur = conn.execute("""
            INSERT OR IGNORE INTO telemetry
            (payload_id, tenant_id, collector_id, source_id,
             event_time, received_at, source_timezone,
             cpu, memory, disk, network_latency,
             health_status, events_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            row["payload_id"],
            tenant_id,
            row["collector_id"],
            row["source_id"],
            row["event_time"],
            row["received_at"],
            row["source_timezone"],
            row["cpu"],
            row["memory"],
            row["disk"],
            row["network_latency"],
            row["health_status"],
            json.dumps(row["events"])
        ))

        inserted = cur.rowcount == 1

        if inserted:
            conn.execute("""
                INSERT INTO collectors
                (tenant_id, collector_id, name, status,
                 last_seen, payload_count, created_at)
                VALUES (?, ?, ?, 'active', ?, 1, ?)
                ON CONFLICT(tenant_id, collector_id)
                DO UPDATE SET
                    last_seen = excluded.last_seen,
                    payload_count = collectors.payload_count + 1,
                    status = 'active'
            """, (
                tenant_id,
                row["collector_id"],
                row["collector_id"],
                row["received_at"],
                now_utc()
            ))

        conn.commit()
        return inserted

    except Exception:
        conn.rollback()
        raise

    finally:
        conn.close()


def _row_to_dict(row):
    result = dict(row)
    result["events"] = json.loads(
        result.pop("events_json") or "[]"
    )
    return result


def get_latest_per_source(tenant_id="demo"):
    conn = get_connection()
    try:
        rows = conn.execute("""
            SELECT t.*
            FROM telemetry t
            JOIN (
                SELECT source_id, MAX(event_time) AS max_time
                FROM telemetry
                WHERE tenant_id = ?
                GROUP BY source_id
            ) m
            ON t.source_id = m.source_id
            AND t.event_time = m.max_time
            WHERE t.tenant_id = ?
        """, (tenant_id, tenant_id)).fetchall()

        return [_row_to_dict(row) for row in rows]
    finally:
        conn.close()


def get_history(source_id, limit=100, tenant_id="demo"):
    conn = get_connection()
    try:
        rows = conn.execute("""
            SELECT * FROM telemetry
            WHERE source_id = ? AND tenant_id = ?
            ORDER BY event_time DESC
            LIMIT ?
        """, (source_id, tenant_id, limit)).fetchall()

        return [_row_to_dict(row) for row in rows]
    finally:
        conn.close()


# ---------------------------------
# INCIDENT OPERATIONS
# ---------------------------------

def create_incident(
    tenant_id,
    source_id,
    title,
    severity,
    description=None,
    probable_cause=None,
    recommendation=None,
    confidence=None
):
    incident_id = str(uuid.uuid4())
    timestamp = now_utc()

    conn = get_connection()
    try:
        conn.execute("""
            INSERT INTO incidents
            (incident_id, tenant_id, source_id, title,
             description, severity, probable_cause,
             recommendation, confidence, first_seen,
             last_seen, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            incident_id, tenant_id, source_id, title,
            description, severity, probable_cause,
            recommendation, confidence, timestamp,
            timestamp, timestamp
        ))

        conn.commit()
        return incident_id
    finally:
        conn.close()


def get_incidents(tenant_id="demo", status=None, limit=100):
    conn = get_connection()
    try:
        if status:
            rows = conn.execute("""
                SELECT * FROM incidents
                WHERE tenant_id = ? AND status = ?
                ORDER BY created_at DESC LIMIT ?
            """, (tenant_id, status, limit)).fetchall()
        else:
            rows = conn.execute("""
                SELECT * FROM incidents
                WHERE tenant_id = ?
                ORDER BY created_at DESC LIMIT ?
            """, (tenant_id, limit)).fetchall()

        return [dict(row) for row in rows]
    finally:
        conn.close()


def update_incident_status(tenant_id, incident_id, status):
    conn = get_connection()
    try:
        cur = conn.execute("""
            UPDATE incidents
            SET status = ?, last_seen = ?
            WHERE incident_id = ? AND tenant_id = ?
        """, (status, now_utc(), incident_id, tenant_id))

        conn.commit()
        return cur.rowcount == 1
    finally:
        conn.close()


# ---------------------------------
# EGRESS AUDIT OPERATIONS
# ---------------------------------

def record_egress_audit(
    tenant_id,
    collector_id,
    payload_id,
    destination,
    approved_fields,
    redacted_count=0,
    rejected_count=0,
    decision="approved"
):
    audit_id = str(uuid.uuid4())

    conn = get_connection()
    try:
        conn.execute("""
            INSERT INTO egress_audit
            (audit_id, tenant_id, collector_id, payload_id,
             destination, approved_fields_json,
             redacted_count, rejected_count, decision, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            audit_id,
            tenant_id,
            collector_id,
            payload_id,
            destination,
            json.dumps(approved_fields),
            redacted_count,
            rejected_count,
            decision,
            now_utc()
        ))

        conn.commit()
        return audit_id
    finally:
        conn.close()


def get_egress_audit(tenant_id="demo", limit=100):
    conn = get_connection()
    try:
        rows = conn.execute("""
            SELECT * FROM egress_audit
            WHERE tenant_id = ?
            ORDER BY created_at DESC LIMIT ?
        """, (tenant_id, limit)).fetchall()

        result = []
        for row in rows:
            item = dict(row)
            item["approved_fields"] = json.loads(
                item.pop("approved_fields_json")
            )
            result.append(item)

        return result
    finally:
        conn.close()
