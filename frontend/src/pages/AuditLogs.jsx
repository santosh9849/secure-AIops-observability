
import { useCallback, useEffect, useState } from 'react'
import {
  ClipboardList,
  ShieldCheck,
  ShieldAlert,
  LockKeyhole,
  FileText,
  Clock,
  Database,
  ArrowUpRight,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react'


const EGRESS_API = 'http://127.0.0.1:8765'
const BACKEND_API = 'http://127.0.0.1:8000'

const REFRESH_INTERVAL = 10000

function formatDate(value) {
  if (!value) return 'Not available'

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

function getAuditRows(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.records)) return data.records
  if (Array.isArray(data?.audit)) return data.audit
  if (Array.isArray(data?.entries)) return data.entries

  return []
}

function normalizeEgressEvent(record, index) {
  const timestamp =
    record.timestamp ||
    record.created_at ||
    record.time ||
    record.prepared_at

  const isDelivery = record.stage === 'delivery'

  if (isDelivery) {
    const status = String(
      record.status || 'UNKNOWN'
    ).toUpperCase()

    const deliveryLabels = {
      DELIVERED: {
        event: 'Telemetry payload delivered',
        decision: 'Delivered',
        classification: 'Metadata Transfer',
      },

      FAILED: {
        event: 'Telemetry delivery failed',
        decision: 'Failed',
        classification: 'Transfer Failure',
      },

      REJECTED_RESPONSE: {
        event: 'Telemetry delivery rejected',
        decision: 'Rejected',
        classification: 'Transfer Rejection',
      },
    }

    const label = deliveryLabels[status] || {
      event: 'Telemetry delivery status',
      decision: status,
      classification: 'Delivery Metadata',
    }

    return {
      id: `egress-delivery-${record.payload_id || index}-${index}`,
      timestamp,
      event: label.event,
      source: 'Local Collector',
      type: 'Data Transfer',
      classification: label.classification,
      decision: label.decision,
      severity: status === 'DELIVERED' ? 'LOW' : 'HIGH',
      sourceGroup: 'egress-delivery',
      payloadId: record.payload_id,
    }
  }

  const rawDecision = String(
    record.decision || 'UNKNOWN'
  ).toUpperCase()

  const isAllowed = rawDecision === 'ALLOW'
  const isBlocked = rawDecision === 'BLOCK'

  const blockedFields =
    record.blocked_fields ||
    record.fields ||
    []

  const classification = isBlocked
    ? Array.isArray(blockedFields) && blockedFields.length
      ? `Blocked fields: ${blockedFields.join(', ')}`
      : 'Policy Violation'
    : 'Approved Metadata'

  return {
    id: `egress-policy-${record.payload_id || index}-${index}`,
    timestamp,
    event: isAllowed
      ? 'Telemetry payload approved by egress policy'
      : isBlocked
        ? 'Telemetry payload blocked by egress policy'
        : 'Egress policy decision recorded',
    source: 'Egress Policy',
    type: 'Policy Enforcement',
    classification,
    decision: isAllowed
      ? 'Allowed'
      : isBlocked
        ? 'Blocked'
        : rawDecision,
    severity: isBlocked ? 'HIGH' : 'LOW',
    sourceGroup: 'egress-policy',
    payloadId: record.payload_id,
  }
}

function normalizeSecurityEvent(record, index) {
  const eventType = String(
    record.event_type || 'SECURITY_EVENT'
  ).toUpperCase()

  const eventDetails = {
    LOGIN_SUCCESS: {
      type: 'Authentication',
      classification: 'Authentication Event',
      decision: 'Recorded',
    },

    LOGIN_FAILED: {
      type: 'Authentication',
      classification: 'Authentication Failure',
      decision: 'Recorded',
    },

    BRUTE_FORCE_DETECTED: {
      type: 'Threat Detection',
      classification: 'Suspicious Authentication Activity',
      decision: 'Alerted',
    },

    LOGIN_BLOCKED: {
      type: 'Access Control',
      classification: 'Blocked Authentication',
      decision: 'Blocked',
    },

    LOGIN_LOCKOUT: {
      type: 'Access Control',
      classification: 'Login Cooldown',
      decision: 'Blocked',
    },
  }

  const details = eventDetails[eventType] || {
    type: 'Security Event',
    classification: 'Security Metadata',
    decision: 'Recorded',
  }

  return {
    id: record.event_id || `security-${index}`,
    timestamp: record.timestamp,
    event: record.title || eventType,
    source: record.source
      ? `Security Monitor · ${record.source}`
      : 'Security Monitor',
    type: details.type,
    classification: details.classification,
    decision: details.decision,
    severity: String(
      record.severity || 'LOW'
    ).toUpperCase(),
    sourceGroup: 'security',
    payloadId: null,
  }
}

function getDecisionClass(decision) {
  const value = String(decision || '').toLowerCase()

  if (
    ['allowed', 'delivered', 'recorded'].includes(value)
  ) {
    return 'allowed'
  }

  if (
    ['blocked', 'rejected', 'failed', 'alerted'].includes(value)
  ) {
    return 'blocked'
  }

  return 'unknown'
}

function AuditLogs() {
  const [auditEvents, setAuditEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [errors, setErrors] = useState([])
  const [lastUpdated, setLastUpdated] = useState(null)

  const loadAuditLogs = useCallback(async () => {
    setRefreshing(true)

    const newErrors = []

    try {
      const token = sessionStorage.getItem('access_token')

      if (!token) {
        throw new Error(
          'Your login session is missing. Please log in again.'
        )
      }

      const [egressResult, securityResult] =
        await Promise.allSettled([
          fetch(
            `${EGRESS_API}/egress/audit`,
            {
              cache: 'no-store',
            }
          ).then(async (response) => {
            if (!response.ok) {
              throw new Error(
                `Egress audit returned HTTP ${response.status}`
              )
            }

            return response.json()
          }),

          fetch(
            `${BACKEND_API}/security/events`,
            {
              cache: 'no-store',
              headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${token}`,
              },
            }
          ).then(async (response) => {
            if (response.status === 401) {
              sessionStorage.removeItem('access_token')
              sessionStorage.removeItem('user_email')

              throw new Error(
                'Your session has expired. Please log in again.'
              )
            }

            if (!response.ok) {
              throw new Error(
                `Security audit returned HTTP ${response.status}`
              )
            }

            return response.json()
          }),
        ])

      let normalizedEvents = []

      // ----------------------------------------
      // EGRESS AUDIT RECORDS
      // ----------------------------------------

      if (egressResult.status === 'fulfilled') {
        const egressRows = getAuditRows(
          egressResult.value
        )

        const normalizedEgress = egressRows.map(
          (record, index) =>
            normalizeEgressEvent(record, index)
        )

        normalizedEvents.push(...normalizedEgress)
      } else {
        newErrors.push(
          `Egress audit: ${
            egressResult.reason?.message ||
            'Unable to retrieve collector audit records.'
          }`
        )
      }

      // ----------------------------------------
      // SECURITY AUDIT RECORDS
      // ----------------------------------------

      if (securityResult.status === 'fulfilled') {
        const securityRows = Array.isArray(
          securityResult.value?.events
        )
          ? securityResult.value.events
          : []

        const normalizedSecurity = securityRows.map(
          (record, index) =>
            normalizeSecurityEvent(record, index)
        )

        normalizedEvents.push(...normalizedSecurity)
      } else {
        newErrors.push(
          `Security audit: ${
            securityResult.reason?.message ||
            'Unable to retrieve security events.'
          }`
        )
      }

      // Newest event first.
      normalizedEvents.sort((a, b) => {
        const first = new Date(
          a.timestamp || 0
        ).getTime()

        const second = new Date(
          b.timestamp || 0
        ).getTime()

        return second - first
      })

      setAuditEvents(normalizedEvents)
      setErrors(newErrors)
      setLastUpdated(new Date())

    } catch (error) {
      setErrors([
        error.message ||
        'Unable to retrieve audit records.',
      ])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadAuditLogs()

    const interval = setInterval(
      loadAuditLogs,
      REFRESH_INTERVAL
    )

    return () => clearInterval(interval)
  }, [loadAuditLogs])

  // Count only policy decisions, not the separate
  // delivery receipt for the same payload.
  const policyEvents = auditEvents.filter(
    (item) => item.sourceGroup === 'egress-policy'
  )

  const allowedTransfers = policyEvents.filter(
    (item) => item.decision === 'Allowed'
  ).length

  const blockedTransfers = policyEvents.filter(
    (item) => item.decision === 'Blocked'
  ).length

  const totalEvents = auditEvents.length

  const policyAvailable = !errors.some(
    (error) => error.startsWith('Egress audit:')
  )

  return (
    <div className="audit-page">

      {/* PAGE HEADER */}

      <div className="page-intro">
        <div>
          <span className="section-eyebrow">
            SECURITY & GOVERNANCE
          </span>

          <h2>Audit Logs</h2>

          <p>
            Review actual data transfers, egress policy
            decisions and authentication security events.
          </p>
        </div>

        <button
          type="button"
          className="incident-action-button"
          onClick={loadAuditLogs}
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

      {/* DATA SOURCE STATUS */}

      <div className="egress-warning">
        <ShieldCheck size={18} />

        <span>
          LIVE AUDIT SOURCES · Collector egress audit
          and backend security event history
        </span>
      </div>

      {errors.length > 0 && (
        <div className="incident-feedback error">
          <AlertTriangle size={17} />

          <div>
            {errors.map((error, index) => (
              <p key={index}>{error}</p>
            ))}
          </div>
        </div>
      )}

      {/* SUMMARY */}

      <div className="audit-summary-grid">

        <div className="audit-summary-card">
          <ClipboardList />

          <span>Total Audit Events</span>

          <strong>
            {loading ? '—' : totalEvents}
          </strong>
        </div>

        <div className="audit-summary-card">
          <ShieldCheck />

          <span>Allowed Transfers</span>

          <strong>
            {loading ? '—' : allowedTransfers}
          </strong>
        </div>

        <div className="audit-summary-card">
          <ShieldAlert />

          <span>Blocked Transfers</span>

          <strong>
            {loading ? '—' : blockedTransfers}
          </strong>
        </div>

        <div className="audit-summary-card">
          <LockKeyhole />

          <span>Egress Policy Status</span>

          <strong className="audit-protected">
            {loading
              ? 'Checking'
              : policyAvailable
                ? 'Available'
                : 'Unavailable'}
          </strong>
        </div>

      </div>

      {/* DATA EGRESS ARCHITECTURE */}

      <section className="egress-panel">

        <div className="egress-heading">
          <div className="egress-icon">
            <LockKeyhole size={23} />
          </div>

          <div>
            <h3>Data Egress Governance</h3>

            <p>
              Local data protection and transfer policy
            </p>
          </div>

          <span className="egress-status">
            {policyAvailable
              ? 'Policy Audit Available'
              : 'Policy Audit Unavailable'}
          </span>
        </div>

        <div className="egress-flow">

          <div className="egress-node">
            <Database size={23} />

            <strong>Local Environment</strong>

            <span>Raw logs and telemetry</span>
          </div>

          <div className="egress-arrow">
            <ArrowUpRight size={22} />

            <span>Filter & Redact</span>
          </div>

          <div className="egress-node">
            <ShieldCheck size={23} />

            <strong>Policy Gateway</strong>

            <span>Allow-list validation</span>
          </div>

          <div className="egress-arrow">
            <ArrowUpRight size={22} />

            <span>Approved metadata</span>
          </div>

          <div className="egress-node">
            <FileText size={23} />

            <strong>Backend Ingestion</strong>

            <span>Approved telemetry metadata</span>
          </div>

        </div>

        <div className="egress-warning">
          <ShieldAlert size={19} />

          <span>
            Raw logs, secrets and sensitive payloads must remain local.
          </span>
        </div>

      </section>

      {/* AUDIT EVENT TABLE */}

      <section className="audit-table-panel">

        <div className="panel-heading">
          <div>
            <h3>Audit Event History</h3>

            <p>
              Actual records from local egress and backend
              authentication audits.
            </p>
          </div>

          <span className="audit-event-count">
            {auditEvents.length} Events
          </span>
        </div>

        {loading ? (
          <div className="incident-empty">
            <RefreshCw size={22} />
            <p>Loading audit records...</p>
          </div>
        ) : auditEvents.length === 0 ? (
          <div className="incident-empty">
            <ClipboardList size={22} />

            <p>
              No audit events are available.
            </p>

            <span>
              Check whether the egress preview server and
              main backend are running.
            </span>
          </div>
        ) : (
          <div className="audit-table-scroll">

            <table className="audit-table">

              <thead>
                <tr>
                  <th>Event</th>
                  <th>Source</th>
                  <th>Classification</th>
                  <th>Decision</th>
                  <th>Timestamp</th>
                </tr>
              </thead>

              <tbody>

                {auditEvents.map((item) => (
                  <tr key={item.id}>

                    <td>
                      <strong>{item.event}</strong>

                      <span>
                        {item.type}
                        {item.payloadId
                          ? ` · ${item.payloadId}`
                          : ''}
                      </span>
                    </td>

                    <td>{item.source}</td>

                    <td>{item.classification}</td>

                    <td>
                      <span
                        className={`audit-decision ${getDecisionClass(item.decision)}`}
                      >
                        {item.decision}
                      </span>

                      {item.severity &&
                        item.severity !== 'LOW' && (
                          <span className="audit-severity">
                            {item.severity}
                          </span>
                        )}
                    </td>

                    <td>
                      <span className="audit-time">
                        <Clock size={13} />

                        {formatDate(item.timestamp)}
                      </span>
                    </td>

                  </tr>
                ))}

              </tbody>

            </table>

          </div>
        )}

      </section>

      {/* FOOTER */}

      <p className="dashboard-disclaimer">
        SentinelOps AI · Local audit evidence ·
        Automatically refreshed every 10 seconds
        {' · '}
        Last updated: {
          lastUpdated
            ? formatDate(lastUpdated)
            : 'Not available'
        }
      </p>

    </div>
  )
}

export default AuditLogs
