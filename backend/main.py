
from contextlib import asynccontextmanager
from backend.routes.incidents import router as incidents_router


from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from backend import database
from backend.models.telemetry import Telemetry
from backend.services.ingestion import ingest_telemetry


# ---------------------------------
# DATABASE INITIALIZATION
# ---------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    database.init_db()
    yield


# ---------------------------------
# FASTAPI APPLICATION
# ---------------------------------

app = FastAPI(
    title="SENTINEL X Backend",
    description="Secure AI-powered observability platform",
    version="1.0.0",
    lifespan=lifespan
)
app.include_router(incidents_router)

# ---------------------------------
# FRONTEND CORS
# ---------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------
# COLLECTOR AUTHENTICATION
# ---------------------------------

def get_current_collector(
    x_api_key: str | None = Header(default=None)
):
    if not x_api_key:
        raise HTTPException(
            status_code=401,
            detail="Missing collector API key"
        )

    collector = database.get_collector_by_api_key(x_api_key)

    if not collector:
        raise HTTPException(
            status_code=401,
            detail="Invalid collector credentials"
        )

    return collector


# ---------------------------------
# HEALTH CHECK
# ---------------------------------

@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "SENTINEL X Backend"
    }


# ---------------------------------
# TELEMETRY INGESTION
# ---------------------------------

@app.post("/ingest")
def ingest(
    payload: Telemetry,
    collector: dict = Depends(get_current_collector)
):
    if payload.collector_id != collector["collector_id"]:
        raise HTTPException(
            status_code=403,
            detail="Collector identity mismatch"
        )

    return ingest_telemetry(
        payload,
        tenant_id=collector["tenant_id"]
    )


# ---------------------------------
# LATEST TELEMETRY
# ---------------------------------

@app.get("/latest")
def latest():
    return database.get_latest_per_source(
        tenant_id="demo"
    )


# ---------------------------------
# TELEMETRY HISTORY
# ---------------------------------

@app.get("/history/{source_id}")
def history(
    source_id: str,
    limit: int = 100
):
    if limit < 1 or limit > 1000:
        raise HTTPException(
            status_code=400,
            detail="Limit must be between 1 and 1000"
        )

    return database.get_history(
        source_id=source_id,
        limit=limit,
        tenant_id="demo"
    )


# ---------------------------------
# COLLECTOR INFORMATION
# ---------------------------------

@app.get("/collectors")
def collectors():
    return database.get_collectors(
        tenant_id="demo"
    )
