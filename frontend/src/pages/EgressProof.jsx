import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock3,
  FileJson2,
  Fingerprint,
  EyeOff,
  AlertCircle,
} from 'lucide-react'

import './EgressProof.css'

const EGRESS_API = 'http://127.0.0.1:8765'

function formatDate(value) {
  if (!value) return 'Not available'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return String(value)

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function displayValue(value) {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function getCount(value) {
  if (Array.isArray(value)) return value.length
  if (typeof value === 'number') return value
  if (value && typeof value === 'object') return Object.keys(value).length
  return '—'
}

function formatPayload(value) {
  if (value === null || value === undefined) {
    return 'No payload preview is available yet.'
  }

  if (typeof value === 'string') {
    try {
      return JSON.stringify(JSON.parse(value), null, 2)
    } catch {
      return value
    }
  }

  return JSON.stringify(value, null, 2)
}

function getAuditRows(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.records)) return data.records
  if (Array.isArray(data?.audit)) return data.audit
  if (Array.isArray(data?.entries)) return data.entries
  return []
}

// Distinguish policy decisions from actual delivery outcomes.
function getAuditEventLabel(record) {
  if (record.stage === 'delivery') {
    return 'Delivery outcome'
  }

  return (
    record.event ||
    record.type ||
    record.stage ||
    (record.reason ? 'Policy decision' : null) ||
    record.action ||
    record.message ||
    'Egress policy decision'
  )
}

function getMetricFields(latest) {
  if (Array.isArray(latest?.approved_metric_fields)) {
    return latest.approved_metric_fields
  }

  if (Array.isArray(latest?.metric_fields)) {
    return latest.metric_fields
  }

  return []
}

function EgressProof() {
  const [latest, setLatest] = useState(null)
  const [audit, setAudit] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [latestError, setLatestError] = useState('')
  const [auditError, setAuditError] = useState('')

  const loadData = useCallback(async () => {
    setRefreshing(true)

    try {
      const [latestResult, auditResult] = await Promise.allSettled([
        fetch(`${EGRESS_API}/egress/latest`, { cache: 'no-store' })
          .then(async (response) => {
            if (!response.ok) {
              throw new Error(
                response.status === 404
                  ? 'No egress preview has been generated yet.'
                  : `Preview server returned HTTP ${response.status}`
              )
            }

            return response.json()
          }),

        fetch(`${EGRESS_API}/egress/audit`, { cache: 'no-store' })
          .then(async (response) => {
            if (!response.ok) {
              throw new Error(`Audit server returned HTTP ${response.status}`)
            }

            return response.json()
          }),
      ])

      if (latestResult.status === 'fulfilled') {
        setLatest(latestResult.value)
        setLatestError('')
      } else {
        setLatest(null)
        setLatestError(
          latestResult.reason?.message || 'Unable to load preview.'
        )
      }

      if (auditResult.status === 'fulfilled') {
        setAudit(getAuditRows(auditResult.value))
        setAuditError('')
      } else {
        setAudit([])
        setAuditError(
          auditResult.reason?.message || 'Unable to load audit history.'
        )
      }

      setLastUpdated(new Date())
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadData()

    const interval = setInterval(loadData, 5000)

    return () => clearInterval(interval)
  }, [loadData])

  const payloadText = useMemo(
    () => formatPayload(latest?.exact_payload_json),
    [latest]
  )

  const decision = String(latest?.decision || 'PENDING').toUpperCase()
  const isAllowed = decision === 'ALLOW'
  const isBlocked = decision === 'BLOCK'

  const approvedMetricFields = getMetricFields(latest)

  return (
    <div className="egress-page">
      <div className="egress-header">
        <div>
          <div className="egress-eyebrow">
            <ShieldCheck size={15} />
            PRIVACY & DATA GOVERNANCE
          </div>

          <h1>Egress Proof</h1>

          <p>
            Inspect exactly what leaves the local environment and review
            the collector's egress audit trail.
          </p>
        </div>

        <button
          className="egress-refresh-button"
          onClick={loadData}
          disabled={refreshing}
        >
          <RefreshCw
            size={16}
            className={refreshing ? 'egress-spinning' : ''}
          />
          Refresh
        </button>
      </div>

      <div className="egress-connection">
        <span
          className={`egress-connection-dot ${latest ? 'connected' : ''}`}
        />

        <span>
          {latest
            ? 'Local preview data received'
            : 'Waiting for local egress preview'}
        </span>

        <span className="egress-updated">
          Last checked: {lastUpdated ? formatDate(lastUpdated) : 'Checking...'}
        </span>
      </div>

      {latestError && (
        <div className="egress-notice">
          <AlertCircle size={18} />

          <div>
            <strong>Preview status</strong>
            <p>{latestError}</p>
            <span>
              Confirm that the local egress preview server is running on
              127.0.0.1:8765.
            </span>
          </div>
        </div>
      )}

      <div className="egress-stats">
        <div className="egress-stat-card">
          <div className="egress-stat-icon">
            <ShieldCheck size={19} />
          </div>

          <span className="egress-stat-label">Latest decision</span>

          <strong
            className={`egress-decision ${
              isAllowed ? 'allow' : isBlocked ? 'block' : ''
            }`}
          >
            {decision}
          </strong>

          <small>Current egress policy result</small>
        </div>

        <div className="egress-stat-card">
          <div className="egress-stat-icon">
            <FileJson2 size={19} />
          </div>

          <span className="egress-stat-label">Approved fields</span>
          <strong>{getCount(latest?.approved_fields)}</strong>
          <small>Fields permitted by policy</small>
        </div>

        <div className="egress-stat-card">
          <div className="egress-stat-icon">
            <XCircle size={19} />
          </div>

          <span className="egress-stat-label">Blocked fields</span>
          <strong>{getCount(latest?.blocked_fields)}</strong>
          <small>Fields rejected by policy</small>
        </div>

        <div className="egress-stat-card">
          <div className="egress-stat-icon">
            <EyeOff size={19} />
          </div>

          <span className="egress-stat-label">Raw logs included</span>

          <strong
            className={
              latest?.raw_logs_included === false
                ? 'egress-safe'
                : 'egress-unknown'
            }
          >
            {latest?.raw_logs_included === false
              ? 'NO'
              : latest?.raw_logs_included === true
                ? 'YES'
                : 'UNKNOWN'}
          </strong>

          <small>Raw log transmission indicator</small>
        </div>
      </div>

      <div className="egress-grid">
        <section className="egress-panel">
          <div className="egress-panel-heading">
            <div>
              <h2>Transmission details</h2>
              <p>Information about the prepared outgoing payload</p>
            </div>

            {isAllowed && (
              <span className="egress-badge allow">
                <CheckCircle2 size={14} /> ALLOWED
              </span>
            )}

            {isBlocked && (
              <span className="egress-badge block">
                <XCircle size={14} /> BLOCKED
              </span>
            )}
          </div>

          <div className="egress-details">
            <div>
              <span>Destination</span>
              <strong>{displayValue(latest?.destination)}</strong>
            </div>

            <div>
              <span>Policy version</span>
              <strong>{displayValue(latest?.policy_version)}</strong>
            </div>

            <div>
              <span>Prepared at</span>
              <strong>{formatDate(latest?.prepared_at)}</strong>
            </div>

            <div>
              <span>Payload ID</span>
              <strong className="egress-mono">
                {displayValue(latest?.payload_id)}
              </strong>
            </div>
          </div>

          <div className="egress-field-section">
            <h3>Approved metric fields</h3>

            <div className="egress-tags">
              {approvedMetricFields.length > 0 ? (
                approvedMetricFields.map((field) => (
                  <span className="egress-tag approved" key={field}>
                    <CheckCircle2 size={13} />
                    {field}
                  </span>
                ))
              ) : (
                <span className="egress-muted">
                  No metric field list available
                </span>
              )}
            </div>
          </div>

          <div className="egress-field-section">
            <h3>Blocked fields</h3>

            <div className="egress-tags">
              {Array.isArray(latest?.blocked_fields) &&
              latest.blocked_fields.length > 0 ? (
                latest.blocked_fields.map((field) => (
                  <span className="egress-tag blocked" key={field}>
                    <XCircle size={13} />
                    {field}
                  </span>
                ))
              ) : (
                <span className="egress-muted">
                  No blocked fields reported in this preview
                </span>
              )}
            </div>
          </div>

          <div className="egress-hash">
            <div className="egress-hash-title">
              <Fingerprint size={16} />
              SHA-256 payload fingerprint
            </div>

            <code>{displayValue(latest?.payload_sha256)}</code>
          </div>
        </section>

        <section className="egress-panel">
          <div className="egress-panel-heading">
            <div>
              <h2>Exact outgoing payload</h2>
              <p>Payload content recorded by the local collector</p>
            </div>

            <span className="egress-code-label">JSON</span>
          </div>

          <pre className="egress-code">
            <code>{payloadText}</code>
          </pre>

          <div className="egress-payload-note">
            <AlertCircle size={15} />
            This is the payload recorded in the local preview file.
          </div>
        </section>
      </div>

      <section className="egress-panel egress-audit-panel">
        <div className="egress-panel-heading">
          <div>
            <h2>Recent egress audit history</h2>
            <p>Events returned by the local audit endpoint</p>
          </div>

          <span className="egress-audit-count">
            {audit.length} records
          </span>
        </div>

        {auditError ? (
          <div className="egress-empty">
            <AlertCircle size={22} />
            <p>{auditError}</p>
          </div>
        ) : loading ? (
          <div className="egress-empty">
            Loading audit history...
          </div>
        ) : audit.length === 0 ? (
          <div className="egress-empty">
            <Clock3 size={22} />
            <p>No audit records are available yet.</p>
          </div>
        ) : (
          <div className="egress-table-wrap">
            <table className="egress-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Event</th>
                  <th>Decision / Status</th>
                  <th>Payload ID</th>
                </tr>
              </thead>

              <tbody>
                {audit.map((record, index) => {
                  const status = String(
                    record.decision ||
                    record.status ||
                    record.action ||
                    '—'
                  ).toUpperCase()

                  // Policy and delivery records can share the same payload ID.
                  // Include event type, timestamp and index for unique row identity.
                  const rowKey = [
                    record.payload_id || 'record',
                    record.stage || record.decision || record.status || 'event',
                    record.timestamp || record.created_at || index,
                    index,
                  ].join('-')

                  return (
                    <tr key={rowKey}>
                      <td>
                        {formatDate(
                          record.timestamp ||
                          record.created_at ||
                          record.time ||
                          record.prepared_at
                        )}
                      </td>

                      <td>
                        {displayValue(getAuditEventLabel(record))}
                      </td>

                      <td>
                        <span
                          className={`egress-table-status ${
                            status === 'ALLOW' || status === 'DELIVERED'
                              ? 'success'
                              : status === 'BLOCK' || status === 'FAILED'
                                ? 'danger'
                                : ''
                          }`}
                        >
                          {status}
                        </span>
                      </td>

                      <td className="egress-mono">
                        {displayValue(record.payload_id)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="egress-footer-note">
        <ShieldCheck size={16} />

        <span>
          Local egress proof view. It displays records provided by the local
          collector preview service; it does not independently inspect network
          traffic.
        </span>
      </div>
    </div>
  )
}

export default EgressProof