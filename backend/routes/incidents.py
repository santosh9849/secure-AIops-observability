
from typing import Literal

from fastapi import APIRouter, HTTPException, Query

from backend import database
from backend.models.incident import (
    IncidentCreate,
    IncidentStatusUpdate
)


router = APIRouter(
    prefix="/incidents",
    tags=["Incidents"]
)

# Local hackathon prototype tenant.
# Production dashboard access must derive tenant identity
# from authenticated user credentials.
DEMO_TENANT_ID = "demo"


@router.post("", status_code=201)
def create_incident(payload: IncidentCreate):

    incident_id = database.create_incident(
        tenant_id=DEMO_TENANT_ID,
        source_id=payload.source_id,
        title=payload.title,
        severity=payload.severity,
        description=payload.description,
        probable_cause=payload.probable_cause,
        recommendation=payload.recommendation,
        confidence=payload.confidence
    )

    return {
        "status": "created",
        "incident_id": incident_id,
        "tenant_id": DEMO_TENANT_ID
    }


@router.get("")
def list_incidents(
    status: Literal[
        "open",
        "acknowledged",
        "resolved"
    ] | None = None,
    limit: int = Query(default=100, ge=1, le=500)
):

    return database.get_incidents(
        tenant_id=DEMO_TENANT_ID,
        status=status,
        limit=limit
    )


@router.patch("/{incident_id}/status")
def update_incident(
    incident_id: str,
    payload: IncidentStatusUpdate
):

    updated = database.update_incident_status(
        tenant_id=DEMO_TENANT_ID,
        incident_id=incident_id,
        status=payload.status
    )

    if not updated:
        raise HTTPException(
            status_code=404,
            detail="Incident not found"
        )

    return {
        "status": "updated",
        "incident_id": incident_id,
        "new_status": payload.status
    }
