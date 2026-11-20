
import { useCallback, useEffect, useState } from 'react'
import {
  Wifi,
  Activity,
  ArrowDownToLine,
  ArrowUpFromLine,
  Radio,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
} from 'lucide-react'

const API_BASE_URL = 'http://127.0.0.1:8000'

const REFRESH_INTERVAL = 5000
const OFFLINE_THRESHOLD_MS = 60 * 1000
const HISTORY_LIMIT = 30

function formatDate(value) {
  if (!value) return 'Not available'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Not available'
  }

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function formatTime(value) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return '--:--'

  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatLatency(value) {
  const number = Number(value)

  return Number.isFinite(number)
    ? number.toFixed(2)
    : '—'
}

function getLatestReceivedSource(rows) {
  return [...rows].sort((a, b) => {
    const first = new Date(a.received_at || 0).getTime()
    const second = new Date(b.received_at || 0).getTime()

    return second - first
  })[0] || null
}

function getConnectivityStatus(collector) {
  if (!collector?.last_seen) return 'Offline'

  const lastSeen = new Date(collector.last_seen).getTime()

  if (!Number.isFinite(lastSeen)) return 'Unknown'

  const age = Date.now() - lastSeen

  return age <= OFFLINE_THRESHOLD_MS
    ? 'Connected'
    : 'Offline'
}

function Network() {
  const [latestRows, setLatestRows] = useState([])
  const [collectors, setCollectors] = useState([])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState(null)

  const loadNetworkData = useCallback(async () => {
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

      // Retrieve actual telemetry and collector status.
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
          'Your login session has expired. Please log in again.'
        )
      }

      const [latestData, collectorData] = await Promise.all([
        latestResponse.json(),
        collectorsResponse.json(),
      ])

      if (!latestResponse.ok) {
        throw new Error(
          latestData.detail ||
          `Telemetry request failed: HTTP ${latestResponse.status}`
        )
      }

      if (!collectorsResponse.ok) {
        throw new Error(
          collectorData.detail ||
          `Collector request failed: HTTP ${collectorsResponse.status}`
        )
      }

      if (
        !Array.isArray(latestData) ||
        !Array.isArray(collectorData)
      ) {
        throw new Error(
          'Unexpected response received from the backend.'
        )
      }

      // Exclude synthetic sources used in our reliability tests.
      const liveRows = latestData.filter((row) => {
        const source = String(
          row.source_id || ''
        ).toLowerCase()

        return (
          !source.startsWith('duplicate-test-source') &&
          !source.startsWith('ordering-test-')
        )
      })

      const primarySource = getLatestReceivedSource(liveRows)

      let historyData = []

      if (primarySource) {
        const historyResponse = await fetch(
          `${API_BASE_URL}/history/${encodeURIComponent(primarySource.source_id)}?limit=${HISTORY_LIMIT}`,
          {
            headers,
            cache: 'no-store',
          }
        )

        if (historyResponse.status === 401) {
          sessionStorage.removeItem('access_token')
          sessionStorage.removeItem('user_email')

          throw new Error(
            'Your login session has expired. Please log in again.'
          )
        }

        if (!historyResponse.ok) {
          throw new Error(
            `History request failed: HTTP ${historyResponse.status}`
          )
        }

        historyData = await historyResponse.json()

        if (!Array.isArray(historyData)) {
          throw new Error(
            'Unexpected network history response.'
          )
        }
      }

      setLatestRows(liveRows)
      setCollectors(collectorData)
      setHistory(historyData)
      setLastUpdated(new Date())
      setError('')

    } catch (err) {
      setError(
        err.message ||
        'Unable to retrieve network telemetry.'
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadNetworkData()

    const interval = setInterval(
      loadNetworkData,
      REFRESH_INTERVAL
    )

    return () => clearInterval(interval)
  }, [loadNetworkData])

  const primarySource = getLatestReceivedSource(latestRows)

  const collectorMap = new Map(
    collectors.map((collector) => [
      collector.collector_id,
      collector,
    ])
  )

  const primaryCollector = primarySource
    ? collectorMap.get(primarySource.collector_id)
    : null

  const connectivityStatus = getConnectivityStatus(
    primaryCollector
  )

  const currentLatency = primarySource?.network_latency

  const latencyAvailable =
    currentLatency !== null &&
    currentLatency !== undefined &&
    Number.isFinite(Number(currentLatency))

  // Backend history is newest first.
  // Reverse the selected records for chronological chart display.
  const latencyTrend = [...history]
    .filter((item) => Number.isFinite(Number(item.network_latency)))
    .slice(0, 8)
    .reverse()
    .map((item) => ({
      timestamp: item.event_time,
      latency: Number(item.network_latency),
    }))

  const maxLatency = Math.max(
    100,
    ...latencyTrend.map((item) => item.latency)
  )

  const networkEvents = history.flatMap((item) => {
    if (!Array.isArray(item.events)) return []

    return item.events.map((event, index) => ({
      id: `${item.payload_id}-${index}`,
      event,
      timestamp: item.event_time,
      source: item.source_id,
    }))
  }).slice(0, 10)

  return (
    <div className="network-page">

      {/* PAGE HEADER */}

      <div className="page-intro">
        <div>
          <span className="section-eyebrow">
            NETWORK OBSERVABILITY
          </span>

          <h2>Network Monitoring</h2>

          <p>
            Monitor live network latency, collector connectivity
            and recorded network events.
          </p>
        </div>

        <button
          type="button"
          className="incident-action-button"
          onClick={loadNetworkData}
          disabled={refreshing}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <RefreshCw
            size={15}
            className={
              refreshing ? 'ai-refresh-spinning' : ''
            }
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

      {/* NETWORK METRICS */}

      <div className="network-metrics">

        <div className="network-metric-card">
          <Activity />

          <span>Network Latency</span>

          <strong>
            {loading || !latencyAvailable
              ? '—'
              : formatLatency(currentLatency)}
            <small> ms</small>
          </strong>

          <p
            className={
              !latencyAvailable
                ? 'warning-text'
                : 'positive-text'
            }
          >
            {latencyAvailable
              ? 'Latest collector measurement'
              : 'No latency measurement available'}
          </p>
        </div>

        <div className="network-metric-card">
          <ArrowDownToLine />

          <span>Download Speed</span>

          <strong>—</strong>

          <p className="warning-text">
            Not collected
          </p>
        </div>

        <div className="network-metric-card">
          <ArrowUpFromLine />

          <span>Upload Speed</span>

          <strong>—</strong>

          <p className="warning-text">
            Not collected
          </p>
        </div>

        <div className="network-metric-card">
          <Radio />

          <span>Packet Loss</span>

          <strong>—</strong>

          <p className="warning-text">
            Not collected
          </p>
        </div>

      </div>

      {/* LATENCY CHART */}

      <section className="network-panel">

        <div className="panel-heading">
          <div>
            <h3>Network Latency Trend</h3>

            <p>
              Recent network probe measurements from actual telemetry
            </p>
          </div>

          <span className="network-live-label">
            ● LIVE TELEMETRY
          </span>
        </div>

        {loading ? (
          <div className="network-empty">
            Loading network history...
          </div>
        ) : latencyTrend.length === 0 ? (
          <div className="network-empty">
            No network latency history is available yet.
          </div>
        ) : (
          <div className="latency-chart">

            {latencyTrend.map((item, index) => {
              const height = Math.max(
                12,
                (item.latency / maxLatency) * 135
              )

              return (
                <div
                  className="latency-column"
                  key={`${item.timestamp}-${index}`}
                >

                  <strong>
                    {item.latency.toFixed(1)} ms
                  </strong>

                  <div className="latency-track">
                    <div
                      className="latency-bar"
                      style={{
                        height: `${height}px`,
                      }}
                    />
                  </div>

                  <span>
                    {formatTime(item.timestamp)}
                  </span>

                </div>
              )
            })}

          </div>
        )}

        <p className="dashboard-disclaimer">
          Source: {primarySource?.source_id || 'No source available'}
          {' · '}
          Measurements are shown in event-time order.
        </p>

      </section>

      {/* CONNECTIVITY */}

      <section className="network-panel">

        <div className="panel-heading">
          <div>
            <h3>Network Connectivity</h3>

            <p>
              Status based on recent successful telemetry ingestion
            </p>
          </div>
        </div>

        {!loading && latestRows.length === 0 && (
          <div className="network-empty">
            No collector connectivity information is available.
          </div>
        )}

        {latestRows.map((row) => {
          const collector = collectorMap.get(
            row.collector_id
          )

          const status = getConnectivityStatus(collector)

          return (
            <div
              className="connectivity-row"
              key={row.source_id}
            >

              <div>
                <Wifi size={22} />

                <div>
                  <strong>
                    Collector → Backend
                  </strong>

                  <span>
                    {row.collector_id} · {row.source_id}
                  </span>
                </div>
              </div>

              <span
                className={
                  status === 'Connected'
                    ? 'connection-status'
                    : 'event-status warning'
                }
              >
                {status}
              </span>

            </div>
          )
        })}

        <div className="connectivity-row">
          <div>
            <Activity size={22} />

            <div>
              <strong>Network Probe</strong>

              <span>
                {latencyAvailable
                  ? `Latest recorded latency: ${formatLatency(currentLatency)} ms`
                  : 'No successful latency measurement available'}
              </span>
            </div>
          </div>

          <span
            className={
              latencyAvailable
                ? 'connection-status'
                : 'event-status warning'
            }
          >
            {latencyAvailable ? 'Measurement available' : 'Unavailable'}
          </span>
        </div>

        <div className="connectivity-row">
          <div>
            <Clock size={22} />

            <div>
              <strong>Last Telemetry Received</strong>

              <span>
                {formatDate(primaryCollector?.last_seen)}
              </span>
            </div>
          </div>
        </div>

      </section>

      {/* RECORDED NETWORK EVENTS */}

      <section className="network-panel">

        <div className="panel-heading">
          <div>
            <h3>Recent Network Events</h3>

            <p>
              Events explicitly included in collector telemetry
            </p>
          </div>
        </div>

        {networkEvents.length === 0 ? (
          <div className="network-empty">
            <Radio size={22} />

            <p>
              No network events have been recorded in the
              current telemetry history.
            </p>
          </div>
        ) : (
          networkEvents.map((item) => {

            const eventName =
              item.event.type ||
              item.event.code ||
              'Network event'

            const eventDescription =
              item.event.message ||
              'Recorded by the local telemetry collector.'

            return (
              <div
                className="network-event"
                key={item.id}
              >

                <AlertTriangle size={19} />

                <div>
                  <strong>{eventName}</strong>

                  <span>
                    {eventDescription}
                  </span>

                  <span>
                    {item.source} · {formatDate(item.timestamp)}
                  </span>
                </div>

                <span className="event-status">
                  Recorded
                </span>

              </div>
            )
          })
        )}

      </section>

      <p className="dashboard-disclaimer">
        SentinelOps AI · Live network telemetry ·
        Bandwidth and packet-loss measurements are not currently
        provided by the collector.
        {' · '}
        Last updated: {lastUpdated ? formatDate(lastUpdated) : 'Not available'}
      </p>

    </div>
  )
}

export default Network
