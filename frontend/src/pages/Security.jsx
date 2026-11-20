
import {
  ShieldCheck,
  ShieldAlert,
  LockKeyhole,
  UserX,
  Globe,
  Clock,
} from 'lucide-react'

const events = [
  {
    title: 'Multiple Failed Login Attempts',
    source: '192.168.1.45',
    description: '8 unsuccessful login attempts detected',
    time: '2 minutes ago',
    severity: 'Critical',
  },
  {
    title: 'Suspicious Access Pattern',
    source: '10.0.0.24',
    description: 'Unusual access activity detected',
    time: '12 minutes ago',
    severity: 'High',
  },
  {
    title: 'Unauthorized Access Attempt',
    source: '172.16.0.18',
    description: 'Access attempt to restricted resource',
    time: '25 minutes ago',
    severity: 'Medium',
  },
  {
    title: 'Login Successful',
    source: '192.168.1.10',
    description: 'User authentication completed',
    time: '40 minutes ago',
    severity: 'Low',
  },
]

function Security() {
  return (
    <div className="security-page">
      <div className="page-intro">
        <div>
          <span className="section-eyebrow">SECURITY OBSERVABILITY</span>
          <h2>Security Monitoring</h2>
          <p>Monitor authentication activity and suspicious behavior.</p>
        </div>
        <span className="sample-label">DEMO DATA</span>
      </div>

      <div className="security-metrics">
        <div className="security-metric-card">
          <ShieldCheck />
          <span>Security Status</span>
          <strong className="security-good">Protected</strong>
        </div>

        <div className="security-metric-card">
          <UserX />
          <span>Failed Login Attempts</span>
          <strong>08</strong>
        </div>

        <div className="security-metric-card">
          <ShieldAlert />
          <span>Suspicious Activities</span>
          <strong>03</strong>
        </div>

        <div className="security-metric-card">
          <LockKeyhole />
          <span>Blocked Attempts</span>
          <strong>05</strong>
        </div>
      </div>

      <section className="security-panel">
        <div className="panel-heading">
          <div>
            <h3>Security Event Timeline</h3>
            <p>Recent authentication and threat activity</p>
          </div>
          <span className="security-indicator">● MONITORING</span>
        </div>

        {events.map((event, index) => (
          <article className="security-event" key={index}>
            <div className={`security-event-icon ${event.severity.toLowerCase()}`}>
              {event.severity === 'Low' ? (
                <ShieldCheck size={20} />
              ) : (
                <ShieldAlert size={20} />
              )}
            </div>

            <div className="security-event-info">
              <strong>{event.title}</strong>
              <p>{event.description}</p>

              <div className="security-event-meta">
                <span><Globe size={13} /> {event.source}</span>
                <span><Clock size={13} /> {event.time}</span>
              </div>
            </div>

            <span className={`severity-tag ${event.severity.toLowerCase()}`}>
              {event.severity}
            </span>
          </article>
        ))}
      </section>

      <section className="security-notice">
        <ShieldAlert size={22} />
        <div>
          <strong>Security simulation</strong>
          <p>
            These events are demonstration records. Real security events
            will be received from the local collector after integration.
          </p>
        </div>
      </section>

      <p className="dashboard-disclaimer">
        SentinelOps AI · Security preview · Sample data
      </p>
    </div>
  )
}

export default Security
