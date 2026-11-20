
import {
  AlertTriangle,
  Clock,
  Server,
  ShieldAlert,
  Activity,
  ArrowUpRight,
  CheckCircle2,
  CircleDot,
} from 'lucide-react'

const incidents = [
  {
    id: 'INC-001',
    title: 'High CPU utilization detected',
    description: 'Production Server CPU usage exceeded the normal baseline.',
    source: 'Infrastructure',
    severity: 'Critical',
    status: 'Open',
    time: '2 minutes ago',
    events: 4,
  },
  {
    id: 'INC-002',
    title: 'Multiple failed login attempts',
    description: 'Repeated authentication failures from a suspicious IP address.',
    source: 'Security',
    severity: 'High',
    status: 'Investigating',
    time: '12 minutes ago',
    events: 8,
  },
  {
    id: 'INC-003',
    title: 'Network latency spike',
    description: 'Network response time increased above its expected baseline.',
    source: 'Network',
    severity: 'Medium',
    status: 'Open',
    time: '25 minutes ago',
    events: 3,
  },
  {
    id: 'INC-004',
    title: 'Memory utilization warning',
    description: 'Application Server memory usage is higher than usual.',
    source: 'Infrastructure',
    severity: 'Low',
    status: 'Resolved',
    time: '1 hour ago',
    events: 2,
  },
]

function Incidents() {
  return (
    <div className="incidents-page">
      <div className="page-intro">
        <div>
          <span className="section-eyebrow">INCIDENT MANAGEMENT</span>
          <h2>Incidents Overview</h2>
          <p>Investigate, prioritize and track infrastructure and security incidents.</p>
        </div>
        <span className="sample-label">DEMO DATA</span>
      </div>

      <div className="incident-summary-grid">
        <div className="incident-summary-card">
          <AlertTriangle />
          <span>Total Incidents</span>
          <strong>04</strong>
        </div>

        <div className="incident-summary-card">
          <CircleDot />
          <span>Open Incidents</span>
          <strong>02</strong>
        </div>

        <div className="incident-summary-card">
          <Activity />
          <span>Investigating</span>
          <strong>01</strong>
        </div>

        <div className="incident-summary-card">
          <CheckCircle2 />
          <span>Resolved</span>
          <strong>01</strong>
        </div>
      </div>

      <section className="incident-panel">
        <div className="panel-heading">
          <div>
            <h3>Incident Timeline</h3>
            <p>Prioritized incidents from monitored systems</p>
          </div>
          <span className="incident-count">4 incidents</span>
        </div>

        {incidents.map((incident) => (
          <article className="incident-item" key={incident.id}>
            <div className={`incident-icon ${incident.severity.toLowerCase()}`}>
              {incident.source === 'Security' ? (
                <ShieldAlert size={21} />
              ) : incident.source === 'Network' ? (
                <Activity size={21} />
              ) : (
                <Server size={21} />
              )}
            </div>

            <div className="incident-details">
              <div className="incident-title-row">
                <strong>{incident.title}</strong>
                <span className="incident-id">{incident.id}</span>
              </div>

              <p>{incident.description}</p>

              <div className="incident-meta">
                <span><Clock size={13} /> {incident.time}</span>
                <span><ArrowUpRight size={13} /> {incident.source}</span>
                <span><Activity size={13} /> {incident.events} related events</span>
              </div>
            </div>

            <div className="incident-labels">
              <span className={`severity-tag ${incident.severity.toLowerCase()}`}>
                {incident.severity}
              </span>
              <span className={`incident-status ${incident.status.toLowerCase()}`}>
                {incident.status}
              </span>
            </div>
          </article>
        ))}
      </section>

      <section className="incident-ai-notice">
        <AlertTriangle size={22} />
        <div>
          <strong>Incident correlation preview</strong>
          <p>
            Related events are grouped into incidents in this demonstration.
            The live correlation engine will be connected during AIOps integration.
          </p>
        </div>
      </section>

      <p className="dashboard-disclaimer">
        SentinelOps AI · Incident management preview · Sample data
      </p>
    </div>
  )
}

export default Incidents
