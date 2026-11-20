
import {
  Wifi,
  Activity,
  ArrowDownToLine,
  ArrowUpFromLine,
  Radio,
  AlertTriangle,
} from 'lucide-react'

const networkEvents = [
  {
    name: 'Latency increased',
    detail: 'Production Server · 2 minutes ago',
    status: 'Warning',
  },
  {
    name: 'Connection restored',
    detail: 'Application Server · 8 minutes ago',
    status: 'Resolved',
  },
  {
    name: 'Packet loss detected',
    detail: 'Gateway · 15 minutes ago',
    status: 'Warning',
  },
]

const latencyData = [
  { time: '10:00', latency: 18 },
  { time: '10:05', latency: 22 },
  { time: '10:10', latency: 20 },
  { time: '10:15', latency: 35 },
  { time: '10:20', latency: 27 },
  { time: '10:25', latency: 24 },
  { time: '10:30', latency: 29 },
]

function Network() {
  return (
    <div className="network-page">
      <div className="page-intro">
        <div>
          <span className="section-eyebrow">NETWORK OBSERVABILITY</span>
          <h2>Network Monitoring</h2>
          <p>Monitor connectivity, bandwidth, latency and packet loss.</p>
        </div>
        <span className="sample-label">DEMO DATA</span>
      </div>

      <div className="network-metrics">
        <div className="network-metric-card">
          <Activity />
          <span>Network Latency</span>
          <strong>24 <small>ms</small></strong>
          <p className="positive-text">Within normal range</p>
        </div>

        <div className="network-metric-card">
          <ArrowDownToLine />
          <span>Download Speed</span>
          <strong>85 <small>Mbps</small></strong>
          <p className="positive-text">Stable connection</p>
        </div>

        <div className="network-metric-card">
          <ArrowUpFromLine />
          <span>Upload Speed</span>
          <strong>42 <small>Mbps</small></strong>
          <p className="positive-text">Stable connection</p>
        </div>

        <div className="network-metric-card">
          <Radio />
          <span>Packet Loss</span>
          <strong>0.4 <small>%</small></strong>
          <p className="warning-text">Needs monitoring</p>
        </div>
      </div>

      <section className="network-panel">
        <div className="panel-heading">
          <div>
            <h3>Network Latency Trend</h3>
            <p>Average response time over recent intervals</p>
          </div>
          <span className="network-live-label">● DEMO</span>
        </div>

        <div className="latency-chart">
          {latencyData.map((item) => (
            <div className="latency-column" key={item.time}>
              <strong>{item.latency} ms</strong>
              <div className="latency-track">
                <div
                  className="latency-bar"
                  style={{ height: `${item.latency * 2.3}px` }}
                />
              </div>
              <span>{item.time}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="network-panel">
        <div className="panel-heading">
          <div>
            <h3>Network Connectivity</h3>
            <p>Current connection status</p>
          </div>
        </div>

        <div className="connectivity-row">
          <div>
            <Wifi size={22} />
            <div>
              <strong>Primary Gateway</strong>
              <span>192.168.1.1</span>
            </div>
          </div>
          <span className="connection-status">Connected</span>
        </div>

        <div className="connectivity-row">
          <div>
            <Wifi size={22} />
            <div>
              <strong>Production Network</strong>
              <span>Production environment</span>
            </div>
          </div>
          <span className="connection-status">Connected</span>
        </div>
      </section>

      <section className="network-panel">
        <div className="panel-heading">
          <div>
            <h3>Recent Network Events</h3>
            <p>Latest network activity and warnings</p>
          </div>
        </div>

        {networkEvents.map((event, index) => (
          <div className="network-event" key={index}>
            <AlertTriangle size={19} />
            <div>
              <strong>{event.name}</strong>
              <span>{event.detail}</span>
            </div>
            <span className={`event-status ${event.status.toLowerCase()}`}>
              {event.status}
            </span>
          </div>
        ))}
      </section>

      <p className="dashboard-disclaimer">
        SentinelOps AI · Network preview · Sample data
      </p>
    </div>
  )
}

export default Network
