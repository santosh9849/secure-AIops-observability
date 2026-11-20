
import { useCallback, useEffect, useState } from 'react'
import {
  Server,
  Cpu,
  MemoryStick,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Wifi,
  Clock,
} from 'lucide-react'

const API_BASE_URL = 'http://127.0.0.1:8000'

const REFRESH_INTERVAL = 5000
const OFFLINE_THRESHOLD = 60 * 1000

function formatDate(value) {
  if (!value) return 'Not available'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return 'Not available'

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function formatMetric(value) {
  const number = Number(value)

  return Number.isFinite(number)
    ? `${number.toFixed(1)}%`
    : '—'
}

function getUsageColor(value) {
  const number = Number(value)

  if (!Number.isFinite(number)) return 'normal'
  if (number >= 85) return 'danger'
  if (number >= 70) return 'warning'

  return 'normal'
}

function UsageBar({ value }) {
  const number = Number(value)
  const safeValue = Number.isFinite(number)
    ? Math.max(0, Math.min(100, number))
    : 0

  const color = getUsageColor(value)

  return (
    <div
      className="usage-bar"
      role="progressbar"
      aria-valuenow={safeValue}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`usage-fill ${color}`}
        style={{ width: `${safeValue}%` }}
      />
    </div>
  )
}

function getServerStatus(server, collector) {
  const lastSeen =
    collector?.last_seen ||
    server.received_at

  const lastSeenTime = lastSeen
    ? new Date(lastSeen).getTime()
    : NaN

  const age = Date.now() - lastSeenTime

  // No recent successful ingestion means the collector is stale.
  if (
    !Number.isFinite(lastSeenTime) ||
    age > OFFLINE_THRESHOLD
  ) {
    return 'Offline'
  }

  const health = String(
    server.health_status || ''
  ).toUpperCase()

  const resources = [
    server.cpu,
    server.memory,
    server.disk,
  ].map(Number)

  const highUsage = resources.some(
    (value) => Number.isFinite(value) && value >= 85
  )

  if (
    health === 'FAIR' ||
    health === 'POOR' ||
    highUsage
  ) {
    return 'Warning'
  }

  if (health === 'GOOD' || health === 'EXCELLENT') {
    return 'Healthy'
  }

  return 'Warning'
}

function Infrastructure() {
  const [servers, setServers] = useState([])
  const [collectors, setCollectors] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState(null)

  const loadInfrastructure = useCallback(async () => {
    setRefreshing(true)

    try {
      const token = sessionStorage.getItem('access_token')

      if (!token) {
        throw new Error(
          'Your login session is missing. Please log in again.'
        )
      }

      const headers = {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      }

      const [latestResponse, collectorsResponse] =
        await Promise.all([
          fetch(`${API_BASE_URL}/latest`, {
            headers,
            cache: 'no-store',
          }),

          fetch(`${API_BASE_URL}/collectors`, {
            headers,
            cache: 'no-store',
          }),
        ])

      if (
        latestResponse.status === 401 ||
        collectorsResponse.status === 401
      ) {
        sessionStorage.removeItem('access_token')
        sessionStorage.removeItem('user_email')

        throw new Error(
          'Your session has expired. Please log in again.'
        )
      }

      const [latestData, collectorsData] =
        await Promise.all([
          latestResponse.json().catch(() => ({})),
          collectorsResponse.json().catch(() => ({})),
        ])

      if (!latestResponse.ok) {
        throw new Error(
          latestData.detail ||
          `Telemetry request failed: HTTP ${latestResponse.status}`
        )
      }

      if (!collectorsResponse.ok) {
        throw new Error(
          collectorsData.detail ||
          `Collector request failed: HTTP ${collectorsResponse.status}`
        )
      }

      if (!Array.isArray(latestData)) {
        throw new Error(
          'Unexpected telemetry response from backend.'
        )
      }

      if (!Array.isArray(collectorsData)) {
        throw new Error(
          'Unexpected collector response from backend.'
        )
      }

      // Exclude only the synthetic test sources used during
      // our duplicate and ordering verification.
      const liveSources = latestData.filter((server) => {
        const source = String(server.source_id || '').toLowerCase()

        return (
          !source.startsWith('duplicate-test-source') &&
          !source.startsWith('ordering-test-')
        )
      })

      setServers(liveSources)
      setCollectors(collectorsData)
      setLastUpdated(new Date())
      setError('')
    } catch (err) {
      setError(
        err.message ||
        'Unable to retrieve infrastructure telemetry.'
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadInfrastructure()

    const interval = setInterval(
      loadInfrastructure,
      REFRESH_INTERVAL
    )

    return () => clearInterval(interval)
  }, [loadInfrastructure])

  const collectorMap = new Map(
    collectors.map((collector) => [
      collector.collector_id,
      collector,
    ])
  )

  const serverRows = servers.map((server) => {
    const collector = collectorMap.get(server.collector_id)

    return {
      ...server,
      collector,
      status: getServerStatus(server, collector),
    }
  })

  const healthyCount = serverRows.filter(
    (server) => server.status === 'Healthy'
  ).length

  const warningCount = serverRows.filter(
    (server) => server.status === 'Warning'
  ).length

  const offlineCount = serverRows.filter(
    (server) => server.status === 'Offline'
  ).length

  return (
    <div className="infrastructure-page">

      <div className="page-intro">
        <div>
          <span className="section-eyebrow">
            INFRASTRUCTURE MONITORING
          </span>

          <h2>Infrastructure Overview</h2>

          <p>
            Monitor actual server resources and infrastructure health
            using received collector telemetry.
          </p>
        </div>

        <button
          type="button"
          className="incident-action-button"
          onClick={loadInfrastructure}
          disabled={refreshing}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <RefreshCw
            size={15}
            className={refreshing ? 'ai-refresh-spinning' : ''}
          />
          Refresh
        </button>
      </div>

      {error && (
        <div className="incident-feedback error">
          <AlertTriangle size={17} />
          {error}
        </div>
      )}

      <div className="infra-summary-grid">

        <div className="infra-summary-card">
          <Server />
          <span>Total Monitored Sources</span>
          <strong>{loading ? '—' : serverRows.length}</strong>
        </div>

        <div className="infra-summary-card">
          <CheckCircle2 />
          <span>Healthy Sources</span>
          <strong>{loading ? '—' : healthyCount}</strong>
        </div>

        <div className="infra-summary-card">
          <AlertTriangle />
          <span>Warning Sources</span>
          <strong>{loading ? '—' : warningCount}</strong>
        </div>

        <div className="infra-summary-card">
          <Server />
          <span>Offline Sources</span>
          <strong>{loading ? '—' : offlineCount}</strong>
        </div>

      </div>

      <section className="infra-server-panel">

        <div className="panel-heading">
          <div>
            <h3>Monitored Infrastructure</h3>

            <p>
              Latest recorded resource utilization by telemetry source
            </p>
          </div>

          <span className="incident-count">
            {serverRows.length} sources
          </span>
        </div>

        {loading && (
          <div className="incident-empty">
            <RefreshCw size={22} />
            <p>Loading infrastructure telemetry...</p>
          </div>
        )}

        {!loading && !error && serverRows.length === 0 && (
          <div className="incident-empty">
            <Server size={24} />
            <p>No infrastructure telemetry is available.</p>
            <span>
              Start the local collector to report server metrics.
            </span>
          </div>
        )}

        {!loading && serverRows.map((server) => {

          const cpu = server.cpu
          const memory = server.memory
          const disk = server.disk

          const statusClass = server.status.toLowerCase()

          const lastSeen =
            server.collector?.last_seen ||
            server.received_at

          return (
            <article
              className="server-card"
              key={server.source_id}
            >

              <div className="server-heading">
                <div>
                  <Server size={20} />

                  <div>
                    <h4>{server.source_id}</h4>

                    <span>
                      Collector: {server.collector_id}
                    </span>
                  </div>
                </div>

                <span
                  className={`server-status ${statusClass}`}
                >
                  {server.status}
                </span>
              </div>

              <div className="server-resources">

                <div>
                  <span>
                    <Cpu size={15} /> CPU
                  </span>

                  <strong>{formatMetric(cpu)}</strong>

                  <UsageBar value={cpu} />
                </div>

                <div>
                  <span>
                    <MemoryStick size={15} /> Memory
                  </span>

                  <strong>{formatMetric(memory)}</strong>

                  <UsageBar value={memory} />
                </div>

                <div>
                  <span>
                    <HardDrive size={15} /> Disk
                  </span>

                  <strong>{formatMetric(disk)}</strong>

                  <UsageBar value={disk} />
                </div>

              </div>

              <div
                className="incident-meta"
                style={{ marginTop: '14px' }}
              >
                <span>
                  <Wifi size={13} />
                  Latency: {
                    Number.isFinite(Number(server.network_latency))
                      ? `${Number(server.network_latency).toFixed(2)} ms`
                      : 'Not available'
                  }
                </span>

                <span>
                  <Clock size={13} />
                  Last received: {formatDate(lastSeen)}
                </span>
              </div>

              <div
                className="incident-extra-details"
                style={{ marginTop: '8px' }}
              >
                <span>
                  Health status:{' '}
                  <strong>
                    {server.health_status || 'Unknown'}
                  </strong>
                </span>

                <span>
                  Payload count:{' '}
                  <strong>
                    {server.collector?.payload_count ?? '—'}
                  </strong>
                </span>
              </div>

            </article>
          )
        })}

      </section>

      <p className="dashboard-disclaimer">
        SentinelOps AI · Live infrastructure telemetry ·
        Reporting status derived from last successful ingestion
        {' · '}
        Last refreshed: {lastUpdated ? formatDate(lastUpdated) : 'Not yet updated'}
      </p>

    </div>
  )
}

export default Infrastructure
