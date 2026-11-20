import { useCallback, useEffect, useState } from 'react'
import {
  AlertTriangle,
  Clock,
  Server,
  ShieldAlert,
  Activity,
  ArrowUpRight,
  CheckCircle2,
  CircleDot,
  RefreshCw,
  Network,
  Check,
  Eye,
} from 'lucide-react'

const API_BASE_URL = 'http://127.0.0.1:8000'

function formatDate(value) {
  if (!value) return 'Not available'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return String(value)

  return date.toLocaleString('en-IN')
}

function getSeverityClass(severity) {
  return String(severity || 'medium').toLowerCase()
}

function getStatusClass(status) {
  return String(status || 'open').toLowerCase()
}

function getSource(incident) {
  const categories = incident.affected_categories || []

  return categories.length
    ? categories.join(', ')
    : 'Infrastructure'
}

// Read the login token before making protected API requests.
function getAuthHeaders() {
  const token = sessionStorage.getItem('access_token')

  if (!token) {
    throw new Error('Your session is missing. Please log in again.')
  }

  return {
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
  }
}

// Handle an expired or invalid login session.
function handleUnauthorized() {
  sessionStorage.removeItem('access_token')
  sessionStorage.removeItem('user_email')
}

async function getResponseData(response) {
  return response.json().catch(() => ({}))
}

function IncidentIcon({ categories, severity }) {
  const category = String(categories?.[0] || '').toLowerCase()

  const className = `incident-icon ${getSeverityClass(severity)}`

  if (category === 'security') {
    return (
      <div className={className}>
        <ShieldAlert size={21} />
      </div>
    )
  }

  if (category === 'network') {
    return (
      <div className={className}>
        <Network size={21} />
      </div>
    )
  }

  return (
    <div className={className}>
      <Server size={21} />
    </div>
  )
}

function Incidents() {
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState(null)
  const [message, setMessage] = useState('')

  const loadIncidents = useCallback(async () => {
    setRefreshing(true)

    try {
      const headers = getAuthHeaders()

      const response = await fetch(
        `${API_BASE_URL}/incidents?limit=100`,
        { headers }
      )

      const data = await getResponseData(response)

      if (response.status === 401) {
        handleUnauthorized()
        throw new Error('Your session has expired. Please log in again.')
      }

      if (!response.ok) {
        throw new Error(
          typeof data.detail === 'string'
            ? data.detail
            : `Unable to retrieve incidents (HTTP ${response.status})`
        )
      }

      if (!Array.isArray(data)) {
        throw new Error('Unexpected incident response from backend.')
      }

      setIncidents(data)
      setError('')
    } catch (err) {
      setError(err.message || 'Unable to load incidents.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadIncidents()
  }, [loadIncidents])

  async function runAnalysis() {
    setMessage('')
    setError('')
    setRefreshing(true)

    try {
      const headers = getAuthHeaders()

      const response = await fetch(
        `${API_BASE_URL}/aiops/analyze/server-001?limit=20`,
        {
          method: 'POST',
          headers,
        }
      )

      const data = await getResponseData(response)

      if (response.status === 401) {
        handleUnauthorized()
        throw new Error('Your session has expired. Please log in again.')
      }

      if (!response.ok) {
        throw new Error(
          typeof data.detail === 'string'
            ? data.detail
            : 'AIOps analysis failed.'
        )
      }

      setMessage(
        `Analysis completed. ${data.incidents_saved ?? 0} incident(s) saved.`
      )

      await loadIncidents()
    } catch (err) {
      setError(err.message || 'Unable to run AIOps analysis.')
    } finally {
      setRefreshing(false)
    }
  }

  async function updateStatus(incidentId, newStatus) {
    setUpdatingId(incidentId)
    setError('')
    setMessage('')

    try {
      const headers = {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      }

      const response = await fetch(
        `${API_BASE_URL}/incidents/${encodeURIComponent(incidentId)}/status`,
        {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      )

      const data = await getResponseData(response)

      if (response.status === 401) {
        handleUnauthorized()
        throw new Error('Your session has expired. Please log in again.')
      }

      if (!response.ok) {
        throw new Error(
          typeof data.detail === 'string'
            ? data.detail
            : 'Unable to update incident status.'
        )
      }

      setMessage(`${incidentId} changed to ${newStatus}.`)

      await loadIncidents()
    } catch (err) {
      setError(err.message || 'Status update failed.')
    } finally {
      setUpdatingId(null)
    }
  }

  const openCount = incidents.filter(
    (item) => item.status === 'OPEN'
  ).length

  const investigatingCount = incidents.filter(
    (item) => item.status === 'ACKNOWLEDGED'
  ).length

  const resolvedCount = incidents.filter(
    (item) => item.status === 'RESOLVED'
  ).length

  const criticalCount = incidents.filter((item) => {
    const severity = String(item.severity || '').toUpperCase()
    return severity === 'HIGH' || severity === 'CRITICAL'
  }).length

  return (
    <div className="incidents-page">
      <div className="page-intro">
        <div>
          <span className="section-eyebrow">INCIDENT MANAGEMENT</span>
          <h2>Incidents Overview</h2>
          <p>
            Investigate, prioritize and track incidents generated
            by the SentinelOps AIOps engine.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '9px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={loadIncidents}
            disabled={refreshing}
            className="incident-action-button"
          >
            <RefreshCw size={15} />
            Refresh
          </button>

          <button
            type="button"
            onClick={runAnalysis}
            disabled={refreshing}
            className="incident-analysis-button"
          >
            <Activity size={15} />
            Run AI Analysis
          </button>
        </div>
      </div>

      {error && (
        <div className="incident-feedback error">
          <AlertTriangle size={17} />
          {error}
        </div>
      )}

      {message && (
        <div className="incident-feedback success">
          <CheckCircle2 size={17} />
          {message}
        </div>
      )}

      <div className="incident-summary-grid">
        <div className="incident-summary-card">
          <AlertTriangle />
          <span>Total Incidents</span>
          <strong>{incidents.length}</strong>
        </div>

        <div className="incident-summary-card">
          <CircleDot />
          <span>Open Incidents</span>
          <strong>{openCount}</strong>
        </div>

        <div className="incident-summary-card">
          <Activity />
          <span>Acknowledged</span>
          <strong>{investigatingCount}</strong>
        </div>

        <div className="incident-summary-card">
          <CheckCircle2 />
          <span>Resolved</span>
          <strong>{resolvedCount}</strong>
        </div>
      </div>

      <section className="incident-panel">
        <div className="panel-heading">
          <div>
            <h3>Incident Timeline</h3>
            <p>
              Persistent incidents retrieved from the SentinelOps database
            </p>
          </div>

          <span className="incident-count">
            {incidents.length} incidents
          </span>
        </div>

        {loading && (
          <div className="incident-empty">
            <RefreshCw size={22} />
            <p>Loading incidents...</p>
          </div>
        )}

        {!loading && incidents.length === 0 && !error && (
          <div className="incident-empty">
            <CheckCircle2 size={24} />
            <p>No incidents are currently stored.</p>
            <span>Run AI Analysis to analyze telemetry.</span>
          </div>
        )}

        {!loading && incidents.map((incident) => {
          const isUpdating = updatingId === incident.incident_id
          const status = String(incident.status || 'OPEN').toUpperCase()

          return (
            <article
              className="incident-item"
              key={incident.incident_id}
            >
              <IncidentIcon
                categories={incident.affected_categories}
                severity={incident.severity}
              />

              <div className="incident-details">
                <div className="incident-title-row">
                  <strong>{incident.title}</strong>
                  <span className="incident-id">
                    {incident.incident_id}
                  </span>
                </div>

                <p>
                  {incident.root_cause_explanation ||
                    'Root-cause explanation not available.'}
                </p>

                <div className="incident-meta">
                  <span>
                    <Clock size={13} />
                    {formatDate(incident.started_at_utc)}
                  </span>

                  <span>
                    <ArrowUpRight size={13} />
                    {getSource(incident)}
                  </span>

                  <span>
                    <Activity size={13} />
                    {incident.correlated_event_count || 0} related events
                  </span>
                </div>

                <div className="incident-extra-details">
                  <span>
                    Root cause: <strong>{incident.root_cause_metric || '—'}</strong>
                  </span>

                  <span>
                    Host: <strong>{incident.root_cause_host || '—'}</strong>
                  </span>

                  <span>
                    Priority: <strong>{incident.priority_score ?? '—'}/100</strong>
                  </span>

                  <span>
                    Confidence:{' '}
                    <strong>
                      {Number.isFinite(Number(incident.confidence))
                        ? `${Math.round(Number(incident.confidence) * 100)}%`
                        : '—'}
                    </strong>
                  </span>
                </div>

                {Array.isArray(incident.evidence) &&
                  incident.evidence.length > 0 && (
                    <details className="incident-evidence">
                      <summary>
                        <Eye size={14} />
                        View evidence ({incident.evidence.length})
                      </summary>

                      <ul>
                        {incident.evidence.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </details>
                  )}

                {Array.isArray(incident.recommended_actions) &&
                  incident.recommended_actions.length > 0 && (
                    <details className="incident-evidence">
                      <summary>
                        <ArrowUpRight size={14} />
                        View recommendations ({incident.recommended_actions.length})
                      </summary>

                      <ul>
                        {incident.recommended_actions.map((item, index) => (
                          <li key={item.action_id || index}>
                            <strong>{item.title || item.action_id}</strong>
                            {item.requires_human_approval &&
                              ' — Human approval required'}
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}

                <div className="incident-controls">
                  {status === 'OPEN' && (
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => updateStatus(
                        incident.incident_id,
                        'ACKNOWLEDGED'
                      )}
                    >
                      <Eye size={14} />
                      Acknowledge
                    </button>
                  )}

                  {status !== 'RESOLVED' && (
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => updateStatus(
                        incident.incident_id,
                        'RESOLVED'
                      )}
                    >
                      <Check size={14} />
                      Resolve
                    </button>
                  )}

                  {isUpdating && <span>Updating...</span>}
                </div>
              </div>

              <div className="incident-labels">
                <span
                  className={`severity-tag ${getSeverityClass(incident.severity)}`}
                >
                  {incident.severity}
                </span>

                <span
                  className={`incident-status ${getStatusClass(status)}`}
                >
                  {status}
                </span>
              </div>
            </article>
          )
        })}
      </section>

      <section className="incident-ai-notice">
        <AlertTriangle size={22} />
        <div>
          <strong>AIOps incident management</strong>
          <p>
            Incidents are generated by the AIOps engine and stored in SQLite.
            Status changes are saved permanently. Recommended remediation
            actions are displayed for human review; no commands are executed.
          </p>
        </div>
      </section>

      <p className="dashboard-disclaimer">
        SentinelOps AI · Live incident records · Persistent SQLite storage
        {' · '}
        High-priority incidents: {criticalCount}
      </p>
    </div>
  )
}

export default Incidents