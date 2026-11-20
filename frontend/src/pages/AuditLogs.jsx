
import { useEffect, useState } from "react";

import {
  ClipboardList,
  ShieldCheck,
  ShieldAlert,
  LockKeyhole,
  FileText,
  Clock,
  Database,
  ArrowUpRight,
} from "lucide-react";

import { getAuditLogs } from "../services/api";

function formatTime(value) {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Time unavailable"
    : date.toLocaleString();
}

function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    let fetching = false;

    const load = async () => {
      if (fetching) return;
      fetching = true;

      try {
        const data = await getAuditLogs();

        if (!active) return;

        setLogs(Array.isArray(data) ? data : []);
        setError("");

      } catch (err) {
        console.error("Audit logs loading failed:", err);

        if (active) {
          setError("Unable to retrieve audit records.");
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

  const approved = logs.filter(
    (item) => item.decision === "approved"
  ).length;

  const partiallyApproved = logs.filter(
    (item) => item.decision === "partially_approved"
  ).length;

  const rejected = logs.reduce(
    (sum, item) => sum + Number(item.rejected_count || 0),
    0
  );

  const totalRedacted = logs.reduce(
    (sum, item) => sum + Number(item.redacted_count || 0),
    0
  );

  return (
    <div className="audit-page">

      <div className="page-intro">
        <div>
          <span className="section-eyebrow">
            SECURITY & GOVERNANCE
          </span>

          <h2>Audit Logs</h2>

          <p>
            Actual telemetry ingestion and data filtering decisions.
          </p>
        </div>

        <span className="sample-label">
          {loading ? "LOADING" : "LIVE RECORDS"}
        </span>
      </div>

      <div className="audit-summary-grid">

        <div className="audit-summary-card">
          <ClipboardList />
          <span>Total Audit Events</span>
          <strong>{logs.length}</strong>
        </div>

        <div className="audit-summary-card">
          <ShieldCheck />
          <span>Fully Approved</span>
          <strong>{approved}</strong>
        </div>

        <div className="audit-summary-card">
          <ShieldAlert />
          <span>Filtered Records</span>
          <strong>{rejected}</strong>
        </div>

        <div className="audit-summary-card">
          <LockKeyhole />
          <span>Recorded Redactions</span>
          <strong>{totalRedacted}</strong>
        </div>

      </div>

      <section className="egress-panel">

        <div className="egress-heading">
          <div className="egress-icon">
            <LockKeyhole size={23} />
          </div>

          <div>
            <h3>Telemetry Egress Governance</h3>
            <p>
              Backend event allow-list filtering and ingestion audit.
            </p>
          </div>

          <span className="egress-status">
            Active
          </span>
        </div>

        <div className="egress-flow">

          <div className="egress-node">
            <Database size={23} />
            <strong>Local Collector</strong>
            <span>System telemetry</span>
          </div>

          <div className="egress-arrow">
            <ArrowUpRight size={22} />
            <span>Authenticated transfer</span>
          </div>

          <div className="egress-node">
            <ShieldCheck size={23} />
            <strong>Backend Filter</strong>
            <span>Event allow-list</span>
          </div>

          <div className="egress-arrow">
            <ArrowUpRight size={22} />
            <span>Approved metadata</span>
          </div>

          <div className="egress-node">
            <FileText size={23} />
            <strong>AIOps Engine</strong>
            <span>Sanitized events</span>
          </div>

        </div>

        <div className="egress-warning">
          <ShieldAlert size={19} />
          <span>
            Unsupported event metadata is excluded before storage
            and AIOps analysis. Recorded redactions are reported
            separately.
          </span>
        </div>

      </section>

      <section className="audit-table-panel">

        <div className="panel-heading">
          <div>
            <h3>Audit Event History</h3>
            <p>Recorded ingestion and filtering decisions.</p>
          </div>

          <span className="audit-event-count">
            {logs.length} Events
          </span>
        </div>

        {loading && logs.length === 0 ? (
          <p>Loading audit records...</p>
        ) : error ? (
          <p>{error}</p>
        ) : logs.length === 0 ? (
          <p>No audit records have been stored yet.</p>
        ) : (
          <div className="audit-table-scroll">

            <table className="audit-table">

              <thead>
                <tr>
                  <th>Event</th>
                  <th>Collector</th>
                  <th>Approved Fields</th>
                  <th>Decision</th>
                  <th>Timestamp</th>
                </tr>
              </thead>

              <tbody>
                {logs.map((item) => (
                  <tr key={item.audit_id}>

                    <td>
                      <strong>
                        Telemetry ingestion
                      </strong>

                      <span>
                        {item.payload_id}
                      </span>
                    </td>

                    <td>{item.collector_id}</td>

                    <td>
                      {Array.isArray(item.approved_fields)
                        ? item.approved_fields.length
                        : 0}
                    </td>

                    <td>
                      <span
                        className={`audit-decision ${
                          String(item.decision).toLowerCase()
                        }`}
                      >
                        {item.decision}
                      </span>

                      <span>
                        Rejected: {item.rejected_count || 0}
                      </span>
                    </td>

                    <td>
                      <span className="audit-time">
                        <Clock size={13} />
                        {formatTime(item.created_at)}
                      </span>
                    </td>

                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        )}

      </section>

      <section className="audit-notice">
        <ShieldAlert size={21} />

        <div>
          <strong>Audit coverage and limitations</strong>

          <p>
            These records document backend event filtering
            decisions. They do not represent a complete record
            of local redaction, authentication attempts, or
            all system activity. Recorded redaction count is
            shown directly from the database.
          </p>
        </div>
      </section>

      <p className="dashboard-disclaimer">
        SentinelOps AI · Backend egress audit records
      </p>

    </div>
  );
}

export default AuditLogs;
