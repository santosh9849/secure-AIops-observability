
import { useEffect, useState } from "react";

import {
  AlertTriangle,
  Clock,
  Server,
  ShieldAlert,
  Activity,
  ArrowUpRight,
  CheckCircle2,
  CircleDot,
} from "lucide-react";

import {
  getIncidents,
  updateIncidentStatus,
} from "../services/api";

function formatTime(value) {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Time unavailable"
    : date.toLocaleString();
}

function Incidents() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState({});

  useEffect(() => {
    let active = true;
    let fetching = false;

    const load = async () => {
      if (fetching) return;
      fetching = true;

      try {
        const data = await getIncidents();

        if (!active) return;

        setIncidents(Array.isArray(data) ? data : []);
        setError("");
      } catch (err) {
        console.error("Incident loading failed:", err);

        if (active) {
          setError("Unable to load incidents from the backend.");
        }
      } finally {
        fetching = false;

        if (active) setLoading(false);
      }
    };

    load();

    const timer = setInterval(load, 5000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  const handleStatusChange = async (incidentId, newStatus) => {
    setUpdating((previous) => ({
      ...previous,
      [incidentId]: true,
    }));

    try {
      await updateIncidentStatus(incidentId, newStatus);

      setIncidents((previous) =>
        previous.map((incident) =>
          incident.incident_id === incidentId
            ? { ...incident, status: newStatus }
            : incident
        )
      );

      setError("");
    } catch (err) {
      console.error("Incident update failed:", err);
      setError("Could not update incident status.");
    } finally {
      setUpdating((previous) => ({
        ...previous,
        [incidentId]: false,
      }));
    }
  };

  const open = incidents.filter(
    (item) => item.status === "open"
  ).length;

  const acknowledged = incidents.filter(
    (item) => item.status === "acknowledged"
  ).length;

  const resolved = incidents.filter(
    (item) => item.status === "resolved"
  ).length;

  const getIcon = (incident) => {
    const value = (
      `${incident.title} ${incident.probable_cause || ""}`
    ).toLowerCase();

    if (value.includes("security") || value.includes("auth")) {
      return <ShieldAlert size={21} />;
    }

    if (
      value.includes("network") ||
      value.includes("latency") ||
      value.includes("packet")
    ) {
      return <Activity size={21} />;
    }

    return <Server size={21} />;
  };

  return (
    <div className="incidents-page">

      <div className="page-intro">
        <div>
          <span className="section-eyebrow">
            INCIDENT MANAGEMENT
          </span>

          <h2>Incidents Overview</h2>

          <p>
            Actual incidents detected and stored by SENTINEL X.
          </p>
        </div>

        <span className="sample-label">
          {loading ? "LOADING" : "LIVE DATA"}
        </span>
      </div>

      <div className="incident-summary-grid">

        <div className="incident-summary-card">
          <AlertTriangle />
          <span>Total Incidents</span>
          <strong>{incidents.length}</strong>
        </div>

        <div className="incident-summary-card">
          <CircleDot />
          <span>Open</span>
          <strong>{open}</strong>
        </div>

        <div className="incident-summary-card">
          <Activity />
          <span>Acknowledged</span>
          <strong>{acknowledged}</strong>
        </div>

        <div className="incident-summary-card">
          <CheckCircle2 />
          <span>Resolved</span>
          <strong>{resolved}</strong>
        </div>

      </div>

      <section className="incident-panel">

        <div className="panel-heading">
          <div>
            <h3>Incident Timeline</h3>
            <p>Live incident records from the backend database.</p>
          </div>

          <span className="incident-count">
            {incidents.length} incidents
          </span>
        </div>

        {loading && incidents.length === 0 ? (
          <p>Loading incidents...</p>
        ) : error && incidents.length === 0 ? (
          <p>{error}</p>
        ) : incidents.length === 0 ? (
          <p>No incidents have been recorded.</p>
        ) : (
          incidents.map((incident) => {
            const severity = String(
              incident.severity || "medium"
            ).toLowerCase();

            const status = String(
              incident.status || "open"
            ).toLowerCase();

            return (
              <article
                className="incident-item"
                key={incident.incident_id}
              >

                <div className={`incident-icon ${severity}`}>
                  {getIcon(incident)}
                </div>

                <div className="incident-details">

                  <div className="incident-title-row">
                    <strong>{incident.title}</strong>

                    <span className="incident-id">
                      {incident.incident_id}
                    </span>
                  </div>

                  <p>
                    {incident.description ||
                      incident.probable_cause ||
                      "No additional description available."}
                  </p>

                  <div className="incident-meta">
                    <span>
                      <Clock size={13} />
                      {formatTime(
                        incident.last_seen ||
                        incident.created_at
                      )}
                    </span>

                    <span>
                      <ArrowUpRight size={13} />
                      {incident.source_id}
                    </span>
                  </div>

                  {incident.recommendation && (
                    <p>
                      Recommendation: {incident.recommendation}
                    </p>
                  )}

                </div>

                <div className="incident-labels">

                  <span className={`severity-tag ${severity}`}>
                    {severity.toUpperCase()}
                  </span>

                  <span className={`incident-status ${status}`}>
                    {status}
                  </span>

                  <select
                    aria-label="Update incident status"
                    value={status}
                    disabled={Boolean(updating[incident.incident_id])}
                    onChange={(event) =>
                      handleStatusChange(
                        incident.incident_id,
                        event.target.value
                      )
                    }
                  >
                    <option value="open">Open</option>
                    <option value="acknowledged">Acknowledge</option>
                    <option value="resolved">Resolved</option>
                  </select>

                  {updating[incident.incident_id] && (
                    <small>Updating...</small>
                  )}

                </div>

              </article>
            );
          })
        )}

        {error && incidents.length > 0 && <p>{error}</p>}

      </section>

      <section className="incident-ai-notice">
        <AlertTriangle size={22} />

        <div>
          <strong>AIOps incident management</strong>
          <p>
            Incidents are generated by the integrated AIOps engine.
            Status changes are saved to the backend database.
            Remediation actions still require human approval.
          </p>
        </div>
      </section>

      <p className="dashboard-disclaimer">
        SentinelOps AI · Backend incident records
      </p>

    </div>
  );
}

export default Incidents;
