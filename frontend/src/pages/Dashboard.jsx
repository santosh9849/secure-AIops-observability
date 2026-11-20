
import { useEffect, useState } from 'react'

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

import {
  getLatestTelemetry,
  getCollectors,
} from '../services/api'

const sampleMetrics = [
  {
    title: 'CPU Usage',
    value: '58.4',
    unit: '%',
    change: 'Processor utilization',
    icon: Cpu,
    color: 'cyan',
    description: 'Current usage',
  },
  {
    title: 'Memory Usage',
    value: '64.2',
    unit: '%',
    change: 'RAM consumption',
    icon: MemoryStick,
    color: 'purple',
    description: 'Current usage',
  },
  {
    title: 'Disk Usage',
    value: '42.8',
    unit: '%',
    change: 'Storage utilization',
    icon: HardDrive,
    color: 'green',
    description: 'Current usage',
  },
  {
    title: 'Network Latency',
    value: '24',
    unit: 'ms',
    change: 'Average response time',
    icon: Wifi,
    color: 'orange',
    description: 'Network health',
  },
]

const alerts = [
  {
    title: 'High CPU utilization detected',
    source: 'Production Server · srv-prod-01',
    time: '2 min ago',
    priority: 'High',
    status: 'Investigating',
  },
  {
    title: 'Repeated failed login attempts',
    source: 'Authentication Service · auth-01',
    time: '8 min ago',
    priority: 'Critical',
    status: 'Open',
  },
  {
    title: 'Network latency increased',
    source: 'Network Monitor · network-01',
    time: '15 min ago',
    priority: 'Medium',
    status: 'Monitoring',
  },
]

function Dashboard() {
  const [telemetry, setTelemetry] = useState(null)
  const [collectors, setCollectors] = useState([])
  const [connectionStatus, setConnectionStatus] = useState('Connecting...')
  const [collectorError, setCollectorError] = useState('')

  useEffect(() => {
    let active = true

    const fetchDashboardData = async () => {
      // Fetch latest telemetry
      try {
        const data = await getLatestTelemetry()

        if (!active) return

        const latest = Array.isArray(data) ? data[0] : data

        if (latest) {
          setTelemetry(latest)
          setConnectionStatus('Live data connected')
        } else {
          setTelemetry(null)
          setConnectionStatus('Connected - no telemetry yet')
        }
      } catch (error) {
        if (!active) return

        console.error('Telemetry fetch failed:', error)
        setConnectionStatus('Backend unavailable')
      }

      // Fetch collector information
      try {
        const collectorData = await getCollectors()

        if (!active) return

        setCollectors(
          Array.isArray(collectorData) ? collectorData : []
        )

        setCollectorError('')
      } catch (error) {
        if (!active) return

        console.error('Collector fetch failed:', error)
        setCollectorError('Unable to load collectors')
      }
    }

    fetchDashboardData()

    const interval = setInterval(fetchDashboardData, 5000)

    return () => {
      active = false
      clearInterval(interval)
    }
  }, [])

  // Use backend telemetry when available
  const metrics = telemetry
    ? [
        {
          ...sampleMetrics[0],
          value: Number(telemetry.cpu).toFixed(1),
        },
        {
          ...sampleMetrics[1],
          value: Number(telemetry.memory).toFixed(1),
        },
        {
          ...sampleMetrics[2],
          value: Number(telemetry.disk).toFixed(1),
        },
        {
          ...sampleMetrics[3],
          value: Number(telemetry.network_latency).toFixed(1),
        },
      ]
    : sampleMetrics

  // Determine collector reporting status
  const totalCollectors = collectors.length

  const reportingCollectors = collectors.filter((collector) => {
    const lastSeen = new Date(collector.last_seen).getTime()
    const age = Date.now() - lastSeen

    return (
      Number.isFinite(lastSeen) &&
      age >= 0 &&
      age <= 60000
    )
  })

  const onlineCount = reportingCollectors.length

  const collectorPercentage = totalCollectors > 0
    ? (onlineCount / totalCollectors) * 100
    : 0

  return (
    <div className="dashboard">

      {/* Dashboard heading */}
      <section className="dashboard-welcome">
        <div>
          <span className="section-eyebrow">
            <span className="live-indicator" />
            SYSTEM MONITORING
          </span>

          <h2>Infrastructure Overview</h2>

          <p>
            Monitor infrastructure health and operational performance.
          </p>
        </div>

        <span className="sample-label">
          {telemetry ? 'LIVE DATA' : 'DEMO DATA'}
        </span>
      </section>

      {/* Overall health */}
      <section className="system-health">
        <div className="health-icon">
          <CheckCircle2 size={26} />
        </div>

        <div className="health-information">
          <span>OVERALL SYSTEM HEALTH</span>
          <h3>{telemetry?.health_status || 'Good'}</h3>
          <p>{connectionStatus}</p>
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

      {/* Infrastructure metrics */}
      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <h3>Infrastructure Metrics</h3>
            <p>
              Key resource utilization across monitored systems
            </p>
          </div>
        </div>

        <div className="metrics-grid">
          {metrics.map((metric) => (
            <MetricCard key={metric.title} {...metric} />
          ))}
        </div>
      </section>

      {/* Charts and collector status */}
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
            <div>
              <strong>
                {String(totalCollectors).padStart(2, '0')}
              </strong>
              <span>Total Collectors</span>
            </div>

            <div>
              <strong>
                {String(onlineCount).padStart(2, '0')}
              </strong>
              <span>Reporting</span>
            </div>
          </div>

          <div className="collector-progress">
            <div style={{ width: `${collectorPercentage}%` }} />
          </div>

          {collectorError ? (
            <p>{collectorError}</p>
          ) : collectors.length === 0 ? (
            <p>No collector records available.</p>
          ) : (
            collectors.map((collector) => {
              const age =
                Date.now() - new Date(collector.last_seen).getTime()

              const isOnline =
                Number.isFinite(age) && age >= 0 && age <= 60000

              return (
                <div
                  className="collector-item"
                  key={collector.collector_id}
                >
                  <span>{collector.collector_id}</span>

                  <span
                    className={
                      isOnline ? 'online-text' : 'offline-text'
                    }
                  >
                    {isOnline ? 'Reporting' : 'Stale'}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </section>

      {/* Recent incidents - currently demo data */}
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

      {/* AI insights */}
      <section className="ai-insight-panel">
        <BrainCircuit size={24} />

        <div>
          <span>AI OPS INSIGHT</span>
          <h3>Intelligent monitoring is ready</h3>

          <p>
            Baseline analysis and event correlation will appear here
            when the AIOps engine is connected.
          </p>
        </div>
      </section>

      <p className="dashboard-disclaimer">
        SentinelOps AI · {telemetry
          ? 'Connected to FastAPI'
          : 'Frontend preview · Sample telemetry data'}
      </p>

    </div>
  )
}

export default Dashboard
