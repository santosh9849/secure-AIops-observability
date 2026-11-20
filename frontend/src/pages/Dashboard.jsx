
import {
  Cpu,
  MemoryStick,
  HardDrive,
  Wifi,
  CheckCircle2,
  Radio,
  BrainCircuit,
} from 'lucide-react'

import MetricCard from '../components/MetricCard'
import Charts from '../components/Charts'
import AlertCard from '../components/AlertCard'

const metrics = [
  { title: 'CPU Usage', value: '58.4', unit: '%', change: 'Processor utilization', icon: Cpu, color: 'cyan', description: 'Current usage' },
  { title: 'Memory Usage', value: '64.2', unit: '%', change: 'RAM consumption', icon: MemoryStick, color: 'purple', description: 'Current usage' },
  { title: 'Disk Usage', value: '42.8', unit: '%', change: 'Storage utilization', icon: HardDrive, color: 'green', description: 'Current usage' },
  { title: 'Network Latency', value: '24', unit: 'ms', change: 'Average response time', icon: Wifi, color: 'orange', description: 'Network health' },
]

const alerts = [
  { title: 'High CPU utilization detected', source: 'Production Server · srv-prod-01', time: '2 min ago', priority: 'High', status: 'Investigating' },
  { title: 'Repeated failed login attempts', source: 'Authentication Service · auth-01', time: '8 min ago', priority: 'Critical', status: 'Open' },
  { title: 'Network latency increased', source: 'Network Monitor · network-01', time: '15 min ago', priority: 'Medium', status: 'Monitoring' },
]

function Dashboard() {
  return (
    <div className="dashboard">

      <section className="dashboard-welcome">
        <div>
          <span className="section-eyebrow">
            <span className="live-indicator" />
            SYSTEM MONITORING
          </span>
          <h2>Infrastructure Overview</h2>
          <p>Monitor infrastructure health and operational performance.</p>
        </div>
        <span className="sample-label">DEMO DATA</span>
      </section>

      <section className="system-health">
        <div className="health-icon">
          <CheckCircle2 size={26} />
        </div>
        <div className="health-information">
          <span>OVERALL SYSTEM HEALTH</span>
          <h3>Good</h3>
          <p>Systems are operating within expected conditions.</p>
        </div>
        <div className="health-stat">
          <strong>12</strong>
          <span>Active Services</span>
        </div>
        <div className="health-stat">
          <strong>3</strong>
          <span>Open Incidents</span>
        </div>
        <div className="health-stat">
          <strong>98.6%</strong>
          <span>Availability</span>
        </div>
      </section>

      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <h3>Infrastructure Metrics</h3>
            <p>Key resource utilization across monitored systems</p>
          </div>
        </div>

        <div className="metrics-grid">
          {metrics.map((metric) => (
            <MetricCard key={metric.title} {...metric} />
          ))}
        </div>
      </section>

      <section className="dashboard-grid">
        <Charts />

        <div className="collector-panel">
          <div className="panel-heading">
            <div>
              <h3>Collector Status</h3>
              <p>Local telemetry agents</p>
            </div>
            <Radio size={20} />
          </div>

          <div className="collector-counts">
            <div><strong>08</strong><span>Total Collectors</span></div>
            <div><strong>07</strong><span>Online</span></div>
          </div>

          <div className="collector-progress"><div /></div>

          <div className="collector-item">
            <span>Production Server</span>
            <span className="online-text">Online</span>
          </div>
          <div className="collector-item">
            <span>Application Server</span>
            <span className="online-text">Online</span>
          </div>
          <div className="collector-item">
            <span>Backup Server</span>
            <span className="offline-text">Offline</span>
          </div>
        </div>
      </section>

      <section className="alerts-panel">
        <div className="panel-heading">
          <div>
            <h3>Recent Incidents</h3>
            <p>Latest alerts requiring attention</p>
          </div>
        </div>

        <div className="alert-list">
          {alerts.map((alert) => (
            <AlertCard key={alert.title} {...alert} />
          ))}
        </div>
      </section>

      <section className="ai-insight-panel">
        <BrainCircuit size={24} />
        <div>
          <span>AI OPS INSIGHT</span>
          <h3>Intelligent monitoring is ready</h3>
          <p>Baseline analysis and event correlation will appear here when the AIOps engine is connected.</p>
        </div>
      </section>

      <p className="dashboard-disclaimer">
        SentinelOps AI · Frontend preview · Sample telemetry data
      </p>

    </div>
  )
}

export default Dashboard
