
import {
  ClipboardList,
  ShieldCheck,
  ShieldAlert,
  LockKeyhole,
  FileText,
  Clock,
  Database,
  ArrowUpRight,
} from 'lucide-react'

const auditEvents = [
  {
    id: 'AUD-001',
    event: 'Telemetry metadata transferred',
    source: 'Local Collector',
    type: 'Data Transfer',
    classification: 'Allowed Metadata',
    decision: 'Allowed',
    time: '10:42:15 UTC',
  },
  {
    id: 'AUD-002',
    event: 'Sensitive field redacted',
    source: 'Local Collector',
    type: 'Data Protection',
    classification: 'Sensitive Data',
    decision: 'Blocked',
    time: '10:40:32 UTC',
  },
  {
    id: 'AUD-003',
    event: 'System health summary transferred',
    source: 'Local Collector',
    type: 'Data Transfer',
    classification: 'Allowed Metadata',
    decision: 'Allowed',
    time: '10:38:10 UTC',
  },
  {
    id: 'AUD-004',
    event: 'Raw log transfer rejected',
    source: 'Egress Policy',
    type: 'Policy Enforcement',
    classification: 'Raw Log Data',
    decision: 'Blocked',
    time: '10:35:48 UTC',
  },
  {
    id: 'AUD-005',
    event: 'Collector authentication verified',
    source: 'Authentication Service',
    type: 'Authentication',
    classification: 'System Metadata',
    decision: 'Allowed',
    time: '10:30:05 UTC',
  },
]

function AuditLogs() {
  return (
    <div className="audit-page">
      <div className="page-intro">
        <div>
          <span className="section-eyebrow">SECURITY & GOVERNANCE</span>
          <h2>Audit Logs</h2>
          <p>Track data transfers, security decisions and policy enforcement.</p>
        </div>
        <span className="sample-label">DEMO DATA</span>
      </div>

      <div className="audit-summary-grid">
        <div className="audit-summary-card">
          <ClipboardList />
          <span>Total Audit Events</span>
          <strong>05</strong>
        </div>

        <div className="audit-summary-card">
          <ShieldCheck />
          <span>Allowed Transfers</span>
          <strong>03</strong>
        </div>

        <div className="audit-summary-card">
          <ShieldAlert />
          <span>Blocked Transfers</span>
          <strong>02</strong>
        </div>

        <div className="audit-summary-card">
          <LockKeyhole />
          <span>Policy Status</span>
          <strong className="audit-protected">Enforced</strong>
        </div>
      </div>

      <section className="egress-panel">
        <div className="egress-heading">
          <div className="egress-icon">
            <LockKeyhole size={23} />
          </div>
          <div>
            <h3>Data Egress Governance</h3>
            <p>Local data protection and transfer policy</p>
          </div>
          <span className="egress-status">Policy Active</span>
        </div>

        <div className="egress-flow">
          <div className="egress-node">
            <Database size={23} />
            <strong>Local Environment</strong>
            <span>Raw logs and telemetry</span>
          </div>

          <div className="egress-arrow">
            <ArrowUpRight size={22} />
            <span>Filter & Redact</span>
          </div>

          <div className="egress-node">
            <ShieldCheck size={23} />
            <strong>Policy Gateway</strong>
            <span>Allow-list validation</span>
          </div>

          <div className="egress-arrow">
            <ArrowUpRight size={22} />
            <span>Approved metadata</span>
          </div>

          <div className="egress-node">
            <FileText size={23} />
            <strong>SaaS Backend</strong>
            <span>Metadata only</span>
          </div>
        </div>

        <div className="egress-warning">
          <ShieldAlert size={19} />
          <span>Raw logs, secrets and sensitive payloads must remain local.</span>
        </div>
      </section>

      <section className="audit-table-panel">
        <div className="panel-heading">
          <div>
            <h3>Audit Event History</h3>
            <p>Recorded data governance and security events</p>
          </div>
          <span className="audit-event-count">5 Events</span>
        </div>

        <div className="audit-table-scroll">
          <table className="audit-table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Source</th>
                <th>Classification</th>
                <th>Decision</th>
                <th>Timestamp</th>
              </tr>
            </thead>

            <tbody>
              {auditEvents.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.event}</strong>
                    <span>{item.id} · {item.type}</span>
                  </td>
                  <td>{item.source}</td>
                  <td>{item.classification}</td>
                  <td>
                    <span className={`audit-decision ${item.decision.toLowerCase()}`}>
                      {item.decision}
                    </span>
                  </td>
                  <td>
                    <span className="audit-time">
                      <Clock size={13} />
                      {item.time}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="audit-notice">
        <ShieldAlert size={21} />
        <div>
          <strong>Audit evidence demonstration</strong>
          <p>
            These records are simulated examples. During integration,
            this page will display actual collector policy decisions,
            transfer metadata and verified audit records.
          </p>
        </div>
      </section>

      <p className="dashboard-disclaimer">
        SentinelOps AI · Audit preview · Sample data
      </p>
    </div>
  )
}

export default AuditLogs
