
import { useEffect, useState } from "react";

import {
  ShieldCheck,
  ShieldAlert,
  LockKeyhole,
  UserX,
  Globe,
  Clock,
} from "lucide-react";

import {
  getIncidents,
  getAuditLogs,
} from "../services/api";

function Security() {
  const [incidents, setIncidents] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    let fetching = false;

    const load = async () => {
      if (fetching) return;
      fetching = true;

      try {
        const [incidentData, auditData] = await Promise.all([
          getIncidents(),
          getAuditLogs(),
        ]);

        if (!active) return;

        setIncidents(Array.isArray(incidentData) ? incidentData : []);
        setAuditLogs(Array.isArray(auditData) ? auditData : []);
        setError("");

      } catch (err) {
        console.error("Security information failed:", err);

        if (active) {
          setError("Unable to retrieve security information.");
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

  const securityIncidents = incidents.filter((item) => {
    const text = (
      `${item.title} ${item.description || ""} ${item.probable_cause || ""}`
    ).toLowerCase();

    return /security|authentication|failed login|brute force|credential|unauthorized access/.test(
      text
    );
  });

  const rejectedEvents = auditLogs.reduce(
    (sum, item) => sum + Number(item.rejected_count || 0),
    0
  );

  const filteredRecords = auditLogs.filter(
    (item) => Number(item.rejected_count || 0) > 0
  ).length;

  const highSeverity = securityIncidents.filter((item) =>
    ["HIGH", "CRITICAL"].includes(
      String(item.severity).toUpperCase()
    )
  ).length;

  function formatTime(value) {
    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? "Time unavailable"
      : date.toLocaleString();
  }

  return (
    <div className="security-page">

      <div className="page-intro">
        <div>
          <span className="section-eyebrow">
            SECURITY OBSERVABILITY
          </span>

          <h2>Security Monitoring</h2>

          <p>
            Actual security-related incidents and telemetry
            filtering decisions.
          </p>
        </div>

        <span className="sample-label">
          {loading ? "LOADING" : "LIVE DATA"}
        </span>
      </div>

      <div className="security-metrics">

        <div className="security-metric-card">
          <ShieldCheck />
          <span>Security Incidents</span>
          <strong>{securityIncidents.length}</strong>
        </div>

        <div className="security-metric-card">
          <ShieldAlert />
          <span>High Priority Incidents</span>
          <strong>{highSeverity}</strong>
        </div>

        <div className="security-metric-card">
          <UserX />
          <span>Filtered Event Records</span>
          <strong>{filteredRecords}</strong>
        </div>

        <div className="security-metric-card">
          <LockKeyhole />
          <span>Unsupported Events Filtered</span>
          <strong>{rejectedEvents}</strong>
        </div>

      </div>

      <section className="security-panel">

        <div className="panel-heading">
          <div>
            <h3>Security Incident Timeline</h3>
            <p>Security-related incidents actually recorded by AIOps.</p>
          </div>

          <span className="security-indicator">
            LIVE RECORDS
          </span>
        </div>

        {loading && securityIncidents.length === 0 ? (
          <p>Loading security records...</p>
        ) : error ? (
          <p>{error}</p>
        ) : securityIncidents.length === 0 ? (
          <div className="security-notice">
            <ShieldCheck size={22} />
            <div>
              <strong>No security incidents recorded</strong>
              <p>
                No authentication or security-related incidents
                are currently available. Failed-login monitoring
                has not yet been connected to the collector.
              </p>
            </div>
          </div>
        ) : (
          securityIncidents.map((item) => (
            <article
              className="security-event"
              key={item.incident_id}
            >
              <div
                className={`security-event-icon ${
                  String(item.severity).toLowerCase()
                }`}
              >
                <ShieldAlert size={20} />
              </div>

              <div className="security-event-info">
                <strong>{item.title}</strong>

                <p>
                  {item.description ||
                    item.probable_cause ||
                    "Security-related incident detected."}
                </p>

                <div className="security-event-meta">
                  <span>
                    <Globe size={13} />
                    {item.source_id}
                  </span>

                  <span>
                    <Clock size={13} />
                    {formatTime(item.created_at)}
                  </span>
                </div>
              </div>

              <span
                className={`severity-tag ${
                  String(item.severity).toLowerCase()
                }`}
              >
                {item.severity}
              </span>
            </article>
          ))
        )}

      </section>

      <section className="security-panel">

        <div className="panel-heading">
          <div>
            <h3>Data Protection Activity</h3>
            <p>Actual event allow-list filtering decisions.</p>
          </div>
        </div>

        {auditLogs.length === 0 ? (
          <p>No audit records available.</p>
        ) : (
          auditLogs.map((item) => (
            <div
              className="network-event"
              key={item.audit_id}
            >
              <LockKeyhole size={19} />

              <div>
                <strong>
                  {item.rejected_count > 0
                    ? "Unsupported telemetry events filtered"
                    : "Telemetry metadata accepted"}
                </strong>

                <span>
                  Collector: {item.collector_id} ·
                  Rejected: {item.rejected_count}
                </span>
              </div>

              <span className="event-status">
                {item.decision}
              </span>
            </div>
          ))
        )}

      </section>

      <section className="security-notice">
        <ShieldAlert size={22} />

        <div>
          <strong>Security monitoring coverage</strong>
          <p>
            Collector API-key authentication and telemetry event
            allow-list filtering are implemented. Failed-login
            monitoring and endpoint-level security event collection
            are not yet configured. No automatic blocking of users
            or remediation is claimed.
          </p>
        </div>
      </section>

      <p className="dashboard-disclaimer">
        SentinelOps AI · Actual security and data-protection records
      </p>

    </div>
  );
}

export default Security;
