
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
} from 'lucide-react'

const insights = [
  {
    title: 'Unusual CPU Usage Pattern',
    source: 'Production Server',
    description:
      'CPU utilization has increased significantly compared with its normal baseline.',
    severity: 'High',
    confidence: 94,
    category: 'Infrastructure',
  },
  {
    title: 'Possible Brute Force Activity',
    source: 'Authentication Service',
    description:
      'Repeated failed login attempts suggest a possible automated login attack.',
    severity: 'Critical',
    confidence: 97,
    category: 'Security',
  },
  {
    title: 'Network Latency Anomaly',
    source: 'Primary Gateway',
    description:
      'Response times are higher than the expected historical network pattern.',
    severity: 'Medium',
    confidence: 89,
    category: 'Network',
  },
]

function AIInsights() {
  return (
    <div className="ai-insights-page">
      <div className="page-intro">
        <div>
          <span className="section-eyebrow">INTELLIGENT OPERATIONS</span>
          <h2>AI Insights</h2>
          <p>Understand anomalies, identify possible root causes and explore recommendations.</p>
        </div>
        <span className="sample-label">DEMO DATA</span>
      </div>

      <section className="ai-overview-card">
        <div className="ai-overview-icon">
          <BrainCircuit size={30} />
        </div>

        <div className="ai-overview-content">
          <span>AI ANALYSIS ENGINE</span>
          <h3>System Intelligence Overview</h3>
          <p>
            SentinelOps AI analyzes system behavior to identify unusual
            patterns and help prioritize incidents.
          </p>
        </div>

        <div className="ai-engine-status">
          <span className="ai-status-dot" />
          Demo Mode
        </div>
      </section>

      <div className="ai-summary-grid">
        <div className="ai-summary-card">
          <Activity />
          <span>Anomalies Detected</span>
          <strong>03</strong>
        </div>

        <div className="ai-summary-card">
          <AlertTriangle />
          <span>High Priority Insights</span>
          <strong>02</strong>
        </div>

        <div className="ai-summary-card">
          <TrendingUp />
          <span>Average Confidence</span>
          <strong>93%</strong>
        </div>

        <div className="ai-summary-card">
          <CheckCircle2 />
          <span>Recommendations</span>
          <strong>03</strong>
        </div>
      </div>

      <section className="ai-panel">
        <div className="panel-heading">
          <div>
            <h3>Detected Anomalies</h3>
            <p>AI-generated analysis of unusual system behavior</p>
          </div>
          <BrainCircuit size={22} />
        </div>

        {insights.map((item, index) => (
          <article className="ai-insight-item" key={index}>
            <div className={`ai-insight-icon ${item.severity.toLowerCase()}`}>
              {item.category === 'Security' ? (
                <ShieldAlert size={21} />
              ) : item.category === 'Network' ? (
                <Activity size={21} />
              ) : (
                <Server size={21} />
              )}
            </div>

            <div className="ai-insight-details">
              <div className="ai-insight-title">
                <strong>{item.title}</strong>
                <span className={`severity-tag ${item.severity.toLowerCase()}`}>
                  {item.severity}
                </span>
              </div>

              <span className="ai-source">{item.source}</span>
              <p>{item.description}</p>

              <div className="ai-confidence">
                <span>Model confidence</span>
                <strong>{item.confidence}%</strong>
              </div>

              <div className="ai-confidence-track">
                <div
                  className="ai-confidence-fill"
                  style={{ width: `${item.confidence}%` }}
                />
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="ai-recommendation-panel">
        <div className="panel-heading">
          <div>
            <h3><Lightbulb size={20} /> Recommended Actions</h3>
            <p>Suggested actions for investigating detected issues</p>
          </div>
        </div>

        <div className="ai-recommendation">
          <div>
            <strong>Investigate CPU resource consumption</strong>
            <p>Review processes consuming excessive CPU resources.</p>
          </div>
          <ArrowRight size={18} />
        </div>

        <div className="ai-recommendation">
          <div>
            <strong>Review suspicious authentication activity</strong>
            <p>Inspect failed login records and verify the source IP.</p>
          </div>
          <ArrowRight size={18} />
        </div>

        <div className="ai-recommendation">
          <div>
            <strong>Check network gateway performance</strong>
            <p>Investigate latency and packet loss at the gateway.</p>
          </div>
          <ArrowRight size={18} />
        </div>
      </section>

      <section className="ai-safety-notice">
        <ShieldAlert size={21} />
        <div>
          <strong>Human approval required</strong>
          <p>
            Recommendations are informational in this demo.
            No automated remediation is executed. Actions will require
            policy checks and human approval.
          </p>
        </div>
      </section>

      <p className="dashboard-disclaimer">
        SentinelOps AI · AI insights preview · Sample data
      </p>
    </div>
  )
}

export default AIInsights
