import { useMemo, useState } from 'react'
import {
  BrainCircuit,
  Activity,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Server,
  ShieldAlert,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Clock,
  Target,
  Network,
  Cpu,
} from 'lucide-react'

const API_BASE_URL = 'http://127.0.0.1:8000'
const SOURCE_ID = 'server-001'
const HISTORY_LIMIT = 20

function formatDate(value) {
  if (!value) return 'Not available'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return String(value)

  return date.toLocaleString('en-IN')
}

function formatScore(value) {
  const score = Number(value)

  if (!Number.isFinite(score)) return '—'

  return `${Math.round(Math.max(0, Math.min(1, score)) * 100)}%`
}

function severityClass(value) {
  const severity = String(value || 'medium').toLowerCase()

  if (severity === 'critical') return 'critical'
  if (severity === 'high') return 'high'
  if (severity === 'low') return 'low'

  return 'medium'
}

function categoryIcon(category) {
  const value = String(category || '').toLowerCase()

  if (value === 'security') return ShieldAlert
  if (value === 'network') return Network
  if (value === 'application') return Activity
  if (value === 'infrastructure') return Server

  return Cpu
}

function AIInsights() {
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lastAnalyzed, setLastAnalyzed] = useState(null)

  const aiopsResult = analysis?.aiops_result

  const anomalies = Array.isArray(aiopsResult?.anomalies)
    ? aiopsResult.anomalies
    : []

  const incidents = Array.isArray(aiopsResult?.incidents)
    ? aiopsResult.incidents
    : []

  const recommendations = useMemo(() => {
    return incidents.flatMap((incident) =>
      (incident.recommended_actions || []).map((action, index) => ({
        ...action,
        incidentTitle: incident.title,
        incidentId: incident.incident_id,
        key: action.action_id || `${incident.incident_id}-${index}`,
      }))
    )
  }, [incidents])

  const highPriorityCount = incidents.filter((incident) => {
    const severity = String(incident.severity || '').toUpperCase()
    return severity === 'HIGH' || severity === 'CRITICAL'
  }).length

  const averageAnomalyScore = anomalies.length
    ? Math.round(
        (anomalies.reduce(
          (total, anomaly) => total + (Number(anomaly.anomaly_score) || 0),
          0
        ) / anomalies.length) * 100
      )
    : 0

  async function runAnalysis() {
    setLoading(true)
    setError('')

    try {
      // Get the authentication token saved during login.
      const accessToken = sessionStorage.getItem('access_token')

      if (!accessToken) {
        throw new Error(
          'Your session is missing. Please log in again before running AI analysis.'
        )
      }

      const response = await fetch(
        `${API_BASE_URL}/aiops/analyze/${encodeURIComponent(SOURCE_ID)}?limit=${HISTORY_LIMIT}`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      const data = await response.json().catch(() => ({}))

      if (response.status === 401) {
        sessionStorage.removeItem('access_token')
        sessionStorage.removeItem('user_email')

        throw new Error(
          'Your session has expired or is invalid. Please log in again.'
        )
      }

      if (!response.ok) {
        throw new Error(
          typeof data.detail === 'string'
            ? data.detail
            : `Analysis request failed with HTTP ${response.status}`
        )
      }

      if (!data.aiops_result) {
        throw new Error('The backend response did not contain AIOps results.')
      }

      setAnalysis(data)
      setLastAnalyzed(new Date())
    } catch (err) {
      setError(
        err.message ||
        'Unable to retrieve AIOps analysis. Check that both backend services are running.'
      )
    } finally {
      setLoading(false)
    }
  }

  const hasResults = Boolean(aiopsResult)

  return (
    <div className="ai-insights-page">
      <div className="page-intro">
        <div>
          <span className="section-eyebrow">INTELLIGENT OPERATIONS</span>
          <h2>AI Insights</h2>
          <p>
            Analyze infrastructure telemetry, identify anomalies,
            investigate root causes and explore remediation recommendations.
          </p>
        </div>

        <button
          type="button"
          onClick={runAnalysis}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            borderRadius: '8px',
            border: '1px solid #334155',
            background: loading ? '#263449' : '#1d4ed8',
            color: '#ffffff',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            fontSize: '13px',
            opacity: loading ? 0.7 : 1,
          }}
        >
          <RefreshCw
            size={16}
            className={loading ? 'ai-refresh-spinning' : ''}
          />
          {loading ? 'Analyzing...' : 'Run AI Analysis'}
        </button>
      </div>

      <section className="ai-overview-card">
        <div className="ai-overview-icon">
          <BrainCircuit size={30} />
        </div>

        <div className="ai-overview-content">
          <span>AI ANALYSIS ENGINE</span>
          <h3>System Intelligence Overview</h3>
          <p>
            SentinelOps analyzes historical infrastructure telemetry using
            multiple detection algorithms, event correlation and root-cause
            analysis.
          </p>
        </div>

        <div className="ai-engine-status">
          <span
            className="ai-status-dot"
            style={{
              background: hasResults ? '#22c55e' : '#94a3b8',
            }}
          />
          {hasResults ? 'Analysis Ready' : 'Awaiting Analysis'}
        </div>
      </section>

      {error && (
        <div
          style={{
            padding: '14px 16px',
            margin: '16px 0',
            borderRadius: '8px',
            border: '1px solid #b45309',
            background: '#422f19',
            color: '#fcd34d',
            fontSize: '13px',
          }}
        >
          <strong>Analysis error</strong>
          <p style={{ margin: '6px 0 0', lineHeight: 1.5 }}>{error}</p>
        </div>
      )}

      <div className="ai-summary-grid">
        <div className="ai-summary-card">
          <Activity />
          <span>Anomalies Detected</span>
          <strong>{hasResults ? anomalies.length : '—'}</strong>
        </div>

        <div className="ai-summary-card">
          <AlertTriangle />
          <span>High Priority Incidents</span>
          <strong>{hasResults ? highPriorityCount : '—'}</strong>
        </div>

        <div className="ai-summary-card">
          <TrendingUp />
          <span>Average Anomaly Score</span>
          <strong>{hasResults ? `${averageAnomalyScore}%` : '—'}</strong>
        </div>

        <div className="ai-summary-card">
          <CheckCircle2 />
          <span>Recommendations</span>
          <strong>{hasResults ? recommendations.length : '—'}</strong>
        </div>
      </div>

      <section className="ai-panel">
        <div className="panel-heading">
          <div>
            <h3>Detected Anomalies</h3>
            <p>
              Results returned by the threshold, statistical and
              Isolation Forest detectors
            </p>
          </div>
          <BrainCircuit size={22} />
        </div>

        {!hasResults && !loading && (
          <div className="ai-empty-state">
            <Activity size={25} />
            <p>Run AI Analysis to retrieve actual telemetry anomalies.</p>
          </div>
        )}

        {loading && (
          <div className="ai-empty-state">
            <RefreshCw size={22} />
            <p>Analyzing stored telemetry...</p>
          </div>
        )}

        {hasResults && anomalies.length === 0 && !loading && (
          <div className="ai-empty-state">
            <CheckCircle2 size={24} />
            <p>No anomalies were detected in this analysis.</p>
          </div>
        )}

        {anomalies.map((item, index) => {
          const Icon = categoryIcon(item.category)
          const score = Number(item.anomaly_score)
          const scorePercent = Number.isFinite(score)
            ? Math.max(0, Math.min(1, score)) * 100
            : 0

          return (
            <article
              className="ai-insight-item"
              key={item.event_id || index}
            >
              <div className="ai-insight-icon medium">
                <Icon size={21} />
              </div>

              <div className="ai-insight-details">
                <div className="ai-insight-title">
                  <strong>
                    {String(item.metric_name || 'Unknown metric')
                      .replaceAll('_', ' ')
                      .replace(/\b\w/g, (char) => char.toUpperCase())}
                  </strong>
                  <span className="severity-tag medium">
                    Anomaly
                  </span>
                </div>

                <span className="ai-source">
                  {item.pseudonymous_host || 'Unknown host'}
                  {' · '}
                  {item.category || 'Uncategorized'}
                </span>

                <p>{item.reason || 'Unusual telemetry pattern detected.'}</p>

                <div className="ai-insight-metadata">
                  <span>
                    Value: <strong>{item.metric_value}</strong>
                  </span>
                  <span>
                    Detector: <strong>{item.detector_type || 'Unknown'}</strong>
                  </span>
                  <span>
                    Time: <strong>{formatDate(item.event_timestamp_utc)}</strong>
                  </span>
                </div>

                <div className="ai-confidence">
                  <span>Model anomaly score</span>
                  <strong>{formatScore(item.anomaly_score)}</strong>
                </div>

                <div className="ai-confidence-track">
                  <div
                    className="ai-confidence-fill"
                    style={{ width: `${scorePercent}%` }}
                  />
                </div>
              </div>
            </article>
          )
        })}
      </section>

      <section className="ai-panel">
        <div className="panel-heading">
          <div>
            <h3>Correlated Incidents</h3>
            <p>
              Incidents produced through event correlation,
              severity classification and root-cause analysis
            </p>
          </div>
          <AlertTriangle size={22} />
        </div>

        {!hasResults && (
          <div className="ai-empty-state">
            <p>Incident results will appear after analysis.</p>
          </div>
        )}

        {hasResults && incidents.length === 0 && (
          <div className="ai-empty-state">
            <CheckCircle2 size={23} />
            <p>No correlated incidents were generated.</p>
          </div>
        )}

        {incidents.map((incident) => (
          <article className="ai-insight-item" key={incident.incident_id}>
            <div
              className={`ai-insight-icon ${severityClass(incident.severity)}`}
            >
              <AlertTriangle size={21} />
            </div>

            <div className="ai-insight-details">
              <div className="ai-insight-title">
                <strong>{incident.title}</strong>
                <span
                  className={`severity-tag ${severityClass(incident.severity)}`}
                >
                  {incident.severity}
                </span>
              </div>

              <span className="ai-source">
                {incident.incident_id}
                {' · '}
                Priority {incident.priority_score}/100
                {' · '}
                {incident.status}
              </span>

              <p>{incident.root_cause_explanation}</p>

              <div className="ai-insight-metadata">
                <span>
                  Root cause:{' '}
                  <strong>{incident.root_cause_metric}</strong>
                </span>
                <span>
                  Host: <strong>{incident.root_cause_host}</strong>
                </span>
                <span>
                  Correlated events:{' '}
                  <strong>{incident.correlated_event_count}</strong>
                </span>
              </div>

              <div className="ai-confidence">
                <span>Root-cause confidence</span>
                <strong>{formatScore(incident.confidence)}</strong>
              </div>

              <div className="ai-confidence-track">
                <div
                  className="ai-confidence-fill"
                  style={{
                    width: `${Math.max(
                      0,
                      Math.min(1, Number(incident.confidence) || 0)
                    ) * 100}%`,
                  }}
                />
              </div>

              {Array.isArray(incident.evidence) &&
                incident.evidence.length > 0 && (
                  <details style={{ marginTop: '12px' }}>
                    <summary style={{ cursor: 'pointer', fontSize: '12px' }}>
                      View incident evidence ({incident.evidence.length})
                    </summary>
                    <ul className="ai-evidence-list">
                      {incident.evidence.map((evidence, index) => (
                        <li key={index}>{evidence}</li>
                      ))}
                    </ul>
                  </details>
                )}
            </div>
          </article>
        ))}
      </section>

      <section className="ai-recommendation-panel">
        <div className="panel-heading">
          <div>
            <h3>
              <Lightbulb size={20} /> Recommended Actions
            </h3>
            <p>
              Remediation suggestions generated by the AIOps
              recommendation engine
            </p>
          </div>
        </div>

        {!hasResults && (
          <div className="ai-empty-state">
            <p>Recommendations will appear after analysis.</p>
          </div>
        )}

        {hasResults && recommendations.length === 0 && (
          <div className="ai-empty-state">
            <p>No recommendations were returned for this analysis.</p>
          </div>
        )}

        {recommendations.map((action) => (
          <div className="ai-recommendation" key={action.key}>
            <div>
              <strong>{action.title || action.action_id || 'Recommended action'}</strong>

              <p>{action.incidentTitle}</p>

              <div className="ai-insight-metadata">
                <span>
                  Risk: <strong>{action.risk_level || 'Not specified'}</strong>
                </span>
                <span>
                  Type: <strong>{action.type || 'Recommendation'}</strong>
                </span>
                <span>
                  Human approval:{' '}
                  <strong>
                    {action.requires_human_approval ? 'Required' : 'Not specified'}
                  </strong>
                </span>
              </div>

              {action.command_preview && (
                <details style={{ marginTop: '8px' }}>
                  <summary style={{ cursor: 'pointer', fontSize: '12px' }}>
                    View command preview
                  </summary>
                  <code className="ai-command-preview">
                    {action.command_preview}
                  </code>
                </details>
              )}
            </div>

            <ArrowRight size={18} />
          </div>
        ))}
      </section>

      <section className="ai-safety-notice">
        <ShieldAlert size={21} />
        <div>
          <strong>Human approval required</strong>
          <p>
            The AIOps engine provides recommendations and command previews.
            This dashboard does not execute remediation commands.
            Any operational action must go through policy checks and
            authorized human approval.
          </p>
        </div>
      </section>

      {hasResults && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '18px',
            marginTop: '15px',
            color: '#94a3b8',
            fontSize: '11px',
          }}
        >
          <span>
            <Clock size={13} style={{ verticalAlign: 'middle' }} />{' '}
            Processing time: {aiopsResult.processing_time_ms} ms
          </span>

          <span>
            <Target size={13} style={{ verticalAlign: 'middle' }} />{' '}
            Events processed: {aiopsResult.processed_events}
          </span>

          <span>
            <Server size={13} style={{ verticalAlign: 'middle' }} />{' '}
            Source: {analysis.source_id}
          </span>
        </div>
      )}

      <p className="dashboard-disclaimer">
        SentinelOps AI · Live AIOps analysis ·
        {lastAnalyzed
          ? ` Last analyzed: ${formatDate(lastAnalyzed)}`
          : ' Analysis not yet run'}
      </p>
    </div>
  )
}

export default AIInsights