
import {
  Server,
  Cpu,
  MemoryStick,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'

const servers = [
  {
    name: 'Production Server',
    id: 'srv-prod-01',
    cpu: 58,
    memory: 64,
    disk: 42,
    status: 'Healthy',
  },
  {
    name: 'Application Server',
    id: 'srv-app-02',
    cpu: 72,
    memory: 68,
    disk: 55,
    status: 'Healthy',
  },
  {
    name: 'Database Server',
    id: 'srv-db-03',
    cpu: 88,
    memory: 82,
    disk: 76,
    status: 'Warning',
  },
]

function UsageBar({ value }) {
  const color = value >= 85 ? 'danger' : value >= 70 ? 'warning' : 'normal'

  return (
    <div className="usage-bar">
      <div className={`usage-fill ${color}`} style={{ width: `${value}%` }} />
    </div>
  )
}

function Infrastructure() {
  return (
    <div className="infrastructure-page">
      <div className="page-intro">
        <div>
          <span className="section-eyebrow">INFRASTRUCTURE MONITORING</span>
          <h2>Infrastructure Overview</h2>
          <p>Monitor server resources and infrastructure health.</p>
        </div>
        <span className="sample-label">DEMO DATA</span>
      </div>

      <div className="infra-summary-grid">
        <div className="infra-summary-card">
          <Server />
          <span>Total Servers</span>
          <strong>08</strong>
        </div>

        <div className="infra-summary-card">
          <CheckCircle2 />
          <span>Healthy Servers</span>
          <strong>06</strong>
        </div>

        <div className="infra-summary-card">
          <AlertTriangle />
          <span>Warning Servers</span>
          <strong>01</strong>
        </div>

        <div className="infra-summary-card">
          <Server />
          <span>Offline Servers</span>
          <strong>01</strong>
        </div>
      </div>

      <section className="infra-server-panel">
        <div className="panel-heading">
          <div>
            <h3>Monitored Servers</h3>
            <p>Resource utilization by server</p>
          </div>
        </div>

        {servers.map((server) => (
          <article className="server-card" key={server.id}>
            <div className="server-heading">
              <div>
                <Server size={20} />
                <div>
                  <h4>{server.name}</h4>
                  <span>{server.id}</span>
                </div>
              </div>

              <span className={`server-status ${server.status.toLowerCase()}`}>
                {server.status}
              </span>
            </div>

            <div className="server-resources">
              <div>
                <span><Cpu size={15} /> CPU</span>
                <strong>{server.cpu}%</strong>
                <UsageBar value={server.cpu} />
              </div>

              <div>
                <span><MemoryStick size={15} /> Memory</span>
                <strong>{server.memory}%</strong>
                <UsageBar value={server.memory} />
              </div>

              <div>
                <span><HardDrive size={15} /> Disk</span>
                <strong>{server.disk}%</strong>
                <UsageBar value={server.disk} />
              </div>
            </div>
          </article>
        ))}
      </section>

      <p className="dashboard-disclaimer">
        SentinelOps AI · Infrastructure preview · Sample data
      </p>
    </div>
  )
}

export default Infrastructure
