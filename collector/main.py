
import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from metrics_collector import MetricsCollector
from security_filter import SecurityFilter
from data_processor import DataProcessor
from payload_builder import PayloadBuilder
from local_buffer import LocalBuffer
from egress_audit import EgressAuditLogger
from secure_sender import SecureSender


# ==========================================
# 1. PROJECT CONFIGURATION
# ==========================================

TENANT_ID = "tenant_eu_01"
REGION = "eu-central"
COLLECTOR_ID = "collector-frankfurt-01"

SAAS_URL = "http://127.0.0.1:8000/api/telemetry/ingest"


# ==========================================
# 2. INITIALIZE COLLECTOR MODULES
# ==========================================

metrics_collector = MetricsCollector(
    hostname="prod-db-server-01",
    source_timezone="Europe/Berlin"
)

security_filter = SecurityFilter(
    tenant_salt="eu-tenant-salt-99"
)

data_processor = DataProcessor(
    TENANT_ID,
    REGION,
    COLLECTOR_ID,
    security_filter
)

payload_builder = PayloadBuilder(
    TENANT_ID,
    REGION,
    COLLECTOR_ID
)

local_buffer = LocalBuffer(
    db_path="collector_local.db"
)

audit_logger = EgressAuditLogger(
    db_path="collector_local.db"
)

secure_sender = SecureSender(
    saas_ingest_url=SAAS_URL,
    tenant_id=TENANT_ID,
    region=REGION
)


# ==========================================
# 3. COLLECTION LOOP
# ==========================================

_running = False


async def collection_loop():

    print("\n================================")
    print(" SENTINELOPS AI COLLECTOR STARTED")
    print("================================")
    print(f"Collector ID: {COLLECTOR_ID}")
    print(f"Tenant ID: {TENANT_ID}")
    print(f"Tier 2 URL: {SAAS_URL}")
    print("================================\n")

    while _running:

        try:
            # STEP 1: Collect local telemetry
            raw_events = metrics_collector.collect_batch()

            # STEP 2: Store raw records locally
            local_buffer.save_raw_events(raw_events)

            # STEP 3: Sanitize and process events
            sanitized_events = data_processor.process_events(
                raw_events
            )

            # STEP 4: Build outbound payload
            health = metrics_collector.get_collector_health()

            payload = payload_builder.build_payload(
                sanitized_events,
                health
            )

            # STEP 5: Add payload to local queue
            local_buffer.enqueue_payload(payload)

            print(
                f"\n[COLLECTED] Payload: {payload['payload_id']}"
            )

            # STEP 6: Send pending payloads to Tier 2
            pending = local_buffer.get_pending_payloads(
                limit=10
            )

            for pay_id, queued_payload in pending:

                try:
                    success, status_msg = await asyncio.to_thread(
                        secure_sender.send_payload,
                        queued_payload
                    )

                    if success:

                        print(
                            f"[SUCCESS] Payload {pay_id}: {status_msg}"
                        )

                        local_buffer.mark_sent(pay_id)

                        audit_logger.record_egress_proof(
                            queued_payload,
                            raw_events,
                            f"DELIVERED ({status_msg})"
                        )

                    else:

                        print(
                            f"[FAILED] Payload {pay_id}: {status_msg}"
                        )

                        local_buffer.increment_attempt(pay_id)

                        if pay_id == payload["payload_id"]:

                            audit_logger.record_egress_proof(
                                queued_payload,
                                raw_events,
                                f"BUFFERED_OFFLINE ({status_msg})"
                            )

                except Exception as send_error:

                    print(
                        f"[SENDER ERROR] Payload {pay_id}: "
                        f"{type(send_error).__name__}: {send_error}"
                    )

                    local_buffer.increment_attempt(pay_id)

            # STEP 7: Display queue status
            stats = local_buffer.get_queue_stats()

            print(
                f"[BUFFER] Pending: {stats.get('pending_payloads', 'N/A')} | "
                f"Sent: {stats.get('sent_payloads', 'N/A')}"
            )

        except Exception as error:

            print(
                f"[COLLECTOR ERROR] "
                f"{type(error).__name__}: {error}"
            )

        await asyncio.sleep(5)

    print("[STOPPED] Collector background task stopped.")


# ==========================================
# 4. FASTAPI LIFESPAN
# ==========================================

@asynccontextmanager
async def lifespan(app: FastAPI):

    global _running

    _running = True

    task = asyncio.create_task(collection_loop())

    try:
        yield

    finally:

        _running = False

        task.cancel()

        try:
            await task
        except asyncio.CancelledError:
            pass


# ==========================================
# 5. FASTAPI APPLICATION
# ==========================================

app = FastAPI(
    title="Tier 1 Local Collector & Egress Airlock",
    version="1.0.0",
    lifespan=lifespan
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# 6. HEALTH CHECK
# ==========================================

@app.get("/health")
def collector_status():

    return {
        "status": "ONLINE",
        "collector_id": COLLECTOR_ID,
        "tenant_id": TENANT_ID,
        "region": REGION,
        "buffer_stats": local_buffer.get_queue_stats(),
        "fault_simulation_active":
            metrics_collector._inject_fault_mode
    }


# ==========================================
# 7. EGRESS PROOF
# ==========================================

@app.get("/local/egress-proof")
def get_egress_proof(limit: int = 5):

    return {
        "collector_id": COLLECTOR_ID,
        "privacy_policy":
            "RAW_DATA_LOCAL_ONLY_STRICT_ALLOWLIST",
        "buffer_stats": local_buffer.get_queue_stats(),
        "proof_records":
            audit_logger.get_recent_proofs(limit=limit)
    }


# ==========================================
# 8. FAULT SIMULATION
# ==========================================

@app.post("/local/simulate-fault/{enabled}")
def toggle_fault_simulation(enabled: bool):

    metrics_collector.set_fault_simulation(enabled)

    return {
        "fault_simulation_active": enabled
    }


# ==========================================
# 9. RUN SERVER
# ==========================================

if __name__ == "__main__":

    import uvicorn

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8002,
        reload=False
    )
