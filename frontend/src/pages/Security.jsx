
import { useCallback, useEffect, useState } from 'react'
import {
  ShieldCheck,
  ShieldAlert,
  LockKeyhole,
  UserX,
  Globe,
  Clock,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react'

const API_BASE_URL = 'http://127.0.0.1:8000'
const REFRESH_INTERVAL_MS = 10000

function formatDate(value) {
  if (!value) return 'Time unavailable'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return String(value)
  }

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function formatTimeAgo(value) {
  if (!value) return 'Time unavailable'

  const timestamp = new Date(value).getTime()

  if (!Number.isFinite(timestamp)) {
    return formatDate(value)
  }

  const seconds = Math.max(
    0,
    Math.floor((Date.now() - timestamp) / 1000)
  )

  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`

  return formatDate(value)
}

function getSeverityClass(severity) {
  const value = String(severity || 'medium').toLowerCase()

  return ['low', 'medium', 'high', 'critical'].includes(value)
    ? value
    : 'medium'
}

function getEventIcon(event) {
  if (event.event_type === 'LOGIN_SUCCESS') {
    return ShieldCheck
  }

  if (event.event_type === 'LOGIN_BLOCKED') {
    return LockKeyhole
  }

  if (event.event_type === 'BRUTE_FORCE_DETECTED') {
    return ShieldAlert
  }

  return UserX
}

function Security() {
  const [securityData, setSecurityData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const loadSecurityData = useCallback(async () => {
    setRefreshing(true)

    try {
      const token = sessionStorage.getItem('access_token')

      if (!token) {
        throw new Error(
          'Your session is missing. Please log in again.'
        )
      }

      const response = await fetch(
        `${API_BASE_URL}/security/events`,
        {
          method: 'GET',
          cache: 'no-store',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const data = await response.json().catch(() => ({}))

      if (response.status === 401) {
        sessionStorage.removeItem('access_token')
        sessionStorage.removeItem('user_email')

        throw new Error(
          'Your session has expired. Please log in again.'
        )
      }

      if (!response.ok) {
        throw new Error(
          typeof data.detail === 'string'
            ? data.detail
            : `Unable to load security events (HTTP ${response.status}).`
        )
      }

      setSecurityData(data)
      setError('')
    } catch (err) {
      setError(
        err.message ||
        'Unable to retrieve security events from the backend.'
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadSecurityData()

    const interval = setInterval(
      loadSecurityData,
      REFRESH_INTERVAL_MS
    )

    return () => clearInterval(interval)
  }, [loadSecurityData])

  const events = Array.isArray(securityData?.events)
    ? securityData.events
    : []

  const isProtected =
    securityData?.security_status === 'PROTECTED'

  return (
    <div className="security-page">

      <div className="page-intro">
        <div>
          <span className="section-eyebrow">
            SECURITY OBSERVABILITY
          </span>

          <h2>Security Monitoring</h2>

          <p>
            Monitor real authentication activity and repeated
            failed login attempts.
          </p>
        </div>

        <button
          type="button"
          onClick={loadSecurityData}
          disabled={refreshing}
          className="incident-action-button"
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

      <div className="security-metrics">

        <div className="security-metric-card">
          <ShieldCheck />

          <span>Authentication Status</span>

          <strong className={isProtected ? 'security-good' : ''}>
            {loading
              ? 'Checking...'
              : isProtected
                ? 'Protected'
                : 'Check configuration'}
          </strong>
        </div>

        <div className="security-metric-card">
          <UserX />

          <span>Failed Login Attempts (24h)</span>

          <strong>
            {securityData?.failed_login_attempts ?? '—'}
          </strong>
        </div>

        <div className="security-metric-card">
          <ShieldAlert />

          <span>Suspicious Activities (24h)</span>

          <strong>
            {securityData?.suspicious_activities ?? '—'}
          </strong>
        </div>

        <div className="security-metric-card">
          <LockKeyhole />

          <span>Blocked Attempts (24h)</span>

          <strong>
            {securityData?.blocked_attempts ?? '—'}
          </strong>
        </div>

      </div>

      {error && (
        <div className="incident-feedback error" role="alert">
          <AlertTriangle size={17} />
          {error}
        </div>
      )}

      <section className="security-panel">

        <div className="panel-heading">
          <div>
            <h3>Security Event Timeline</h3>

            <p>
              Real login events recorded by the SentinelOps
              backend in the last 24 hours.
            </p>
          </div>

          <span className="security-indicator">
            ● LIVE MONITORING
          </span>
        </div>

        {loading && !securityData ? (
          <div className="security-event-empty">
            Loading security events...
          </div>
        ) : events.length === 0 ? (
          <div className="security-event-empty">
            No authentication events have been recorded yet.
            A successful login or failed login attempt will
            appear here.
          </div>
        ) : (
          events.map((event) => {
            const Icon = getEventIcon(event)

            const severity = getSeverityClass(
              event.severity
            )

            return (
              <article
                className="security-event"
                key={event.event_id}
              >

                <div
                  className={`security-event-icon ${severity}`}
                >
                  <Icon size={20} />
                </div>

                <div className="security-event-info">

                  <strong>
                    {event.title || 'Authentication event'}
                  </strong>

                  <p>
                    {event.description ||
                      'No additional event details.'}
                  </p>

                  <div className="security-event-meta">

                    <span title="Pseudonymous client identifier">
                      <Globe size={13} />
                      {event.source || 'Unknown client'}
                    </span>

                    <span title={formatDate(event.timestamp)}>
                      <Clock size={13} />
                      {formatTimeAgo(event.timestamp)}
                    </span>

                  </div>
                </div>

                <span
                  className={`severity-tag ${severity}`}
                >
                  {severity.charAt(0).toUpperCase() +
                    severity.slice(1)}
                </span>

              </article>
            )
          })
        )}

      </section>

      <section className="security-notice">

        <ShieldAlert size={22} />

        <div>
          <strong>Authentication abuse detection</strong>

          <p>
            Failed credentials are audited without storing
            passwords or submitted email addresses.
            Three failed attempts from the same pseudonymous
            client within five minutes generate a critical
            security event. Five failures trigger a five-minute
            login cooldown for that client.
            Dashboard counters cover the last 24 hours.
          </p>
        </div>

      </section>

      <p className="dashboard-disclaimer">
        SentinelOps AI · Local authentication audit ·
        Automatically refreshed every 10 seconds
      </p>

    </div>
  )
}

export default Security
