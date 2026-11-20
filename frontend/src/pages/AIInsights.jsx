
import { useEffect, useState } from "react";

import {
  BrainCircuit,
  Activity,
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
  ShieldAlert,
  Server,
  Lightbulb,
  ArrowRight,
} from "lucide-react";

import { getIncidents } from "../services/api";


function AIInsights() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    let fetching = false;

    const load = async () => {
      if (fetching) return;
      fetching = true;

      try {
        const result = await getIncidents();

        if (!active) return;

        setIncidents(Array.isArray(result) ? result : []);
        setError("");

      } catch (err) {
        console.error("AIOps insights error:", err);
        if (active) setError("Unable to retrieve AIOps incidents.");
      } finally {
        fetching = false;
        if (active) setLoading(false);
      }
    };

    load();
    const timer = setInterval(load, 5000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  const highPriority = incidents.filter(incident =>
    ["HIGH", "CRITICAL"].includes(
      String(incident.severity).toUpperCase()
    )
  ).length;

  const confidenceValues = incidents
    .map(item => Number(item.confidence))
    .filter(value => Number.isFinite(value) && value >= 0 && value <= 1);

  const averageConfidence = confidenceValues.length
    ? (
        confidenceValues.reduce((sum, value) => sum + value, 0) /
        confidenceValues.length *
        100
      ).toFixed(1)
    : null;

  const recommendations = incidents.flatMap(incident =>
    String(incident.recommendation || "")
      .split("\n")
      .map(text => ({
        text: text.replace(/\s*\(human approval required\)/gi, "").trim(),
        title: incident.title,
        approvalRequired: /human approval required/i.test(
          incident.recommendation || ""
        ),
      }))
      .filter(item => item.text)
  );

  function categoryFor(incident) {
    const metric = String(
      incident.probable_cause || ""
    ).toLowerCase();

    if (
      metric.includes("network") ||
      metric.includes("latency") ||
      metric.includes("packet") ||
      metric.includes("bandwidth")
    ) return "Network";

    if (
      metric.includes("security") ||
      metric.includes("auth")
    ) return "Security";

    return "Infrastructure";
  }

  return (
    <div className="ai-insights-page">

      <div className="page-intro">
        <div>
          <span className="section-eyebrow">
            INTELLIGENT OPERATIONS
          </span>

          <h2>AI Insights</h2>
          <p>
            Actual incidents, root-cause information and recommendations
            from the AIOps engine.
          </p>
        </div>

        <span className="sample-label">
          {loading ? "LOADING" : error ? "UNAVAILABLE" : "LIVE DATA"}
        </span>
      </div>

      <section className="ai-overview-card">
        <div className="ai-overview-icon">
          <BrainCircuit size={30} />
        </div>

        <div className="ai-overview-content">
          <span>AI ANALYSIS ENGINE</span>
          <h3>System Intelligence Overview</h3>

          <p>
            Anomalies are processed through threshold detection,
            statistical analysis, machine-learning detection,
            event correlation and root-cause analysis.
          </p>
        </div>

        <div className="ai-engine-status">
          <span className="ai-status-dot" />
          {error ? "Unavailable" : "Integrated"}
        </div>
      </section>

      <div className="ai-summary-grid">

        <div className="ai-summary-card">
          <Activity />
          <span>AIOps Incidents</span>
          <strong>{incidents.length}</strong>
        </div>

        <div className="ai-summary-card">
          <AlertTriangle />
          <span>High Priority</span>
          <strong>{highPriority}</strong>
        </div>

        <div className="ai-summary-card">
          <TrendingUp />
          <span>Average Confidence</span>
          <strong>
            {averageConfidence !== null
              ? `${averageConfidence}%`
              : "—"}
          </strong>
        </div>

        <div className="ai-summary-card">
          <CheckCircle2 />
          <span>Recommendations</span>
          <strong>{recommendations.length}</strong>
        </div>

      </div>

      <section className="ai-panel">
        <div className="panel-heading">
          <div>
            <h3>Detected Incidents</h3>
            <p>AI-correlated incidents stored by the backend.</p>
          </div>

          <BrainCircuit size={22} />
        </div>

        {loading && incidents.length === 0 ? (
          <p>Loading AIOps information...</p>
        ) : error ? (
          <p>{error}</p>
        ) : incidents.length === 0 ? (
          <p>No AIOps incidents have been recorded.</p>
        ) : (
          incidents.map((item, index) => {
            const severity = String(item.severity || "MEDIUM");
            const category = categoryFor(item);
            const confidence = Number(item.confidence);
            const hasConfidence =
              Number.isFinite(confidence) &&
              confidence >= 0 &&
              confidence <= 1;

            return (
              <article className="ai-insight-item" key={item.incident_id || index}>
                <div className={`ai-insight-icon ${severity.toLowerCase()}`}>
                  {category === "Security" ? (
                    <ShieldAlert size={21} />
                  ) : category === "Network" ? (
                    <Activity size={21} />
                  ) : (
                    <Server size={21} />
                  )}
                </div>

                <div className="ai-insight-details">
                  <div className="ai-insight-title">
                    <strong>{item.title}</strong>

                    <span className={`severity-tag ${severity.toLowerCase()}`}>
                      {severity}
                    </span>
                  </div>

                  <span className="ai-source">
                    {item.source_id}
                  </span>

                  <p>
                    {item.description ||
                      item.probable_cause ||
                      "A correlated incident was identified by AIOps."}
                  </p>

                  {hasConfidence && (
                    <>
                      <div className="ai-confidence">
                        <span>Model confidence</span>
                        <strong>{(confidence * 100).toFixed(1)}%</strong>
                      </div>

                      <div className="ai-confidence-track">
                        <div
                          className="ai-confidence-fill"
                          style={{ width: `${confidence * 100}%` }}
                        />
                      </div>
                    </>
                  )}
                </div>
              </article>
            );
          })
        )}
      </section>

      <section className="ai-recommendation-panel">
        <div className="panel-heading">
          <div>
            <h3>
              <Lightbulb size={20} /> Recommended Actions
            </h3>

            <p>
              Recommendations returned by the AIOps engine.
            </p>
          </div>
        </div>

        {recommendations.length === 0 ? (
          <p>No recommendations are currently available.</p>
        ) : (
          recommendations.map((item, index) => (
            <div className="ai-recommendation" key={`${index}-${item.title}`}>
              <div>
                <strong>{item.title}</strong>
                <p>{item.text}</p>

                {item.approvalRequired && (
                  <small>Human approval required before action.</small>
                )}
              </div>

              <ArrowRight size={18} />
            </div>
          ))
        )}
      </section>

      <section className="ai-safety-notice">
        <ShieldAlert size={21} />

        <div>
          <strong>Human approval required</strong>

          <p>
            Recommendations are informational. No automatic
            remediation is executed by this dashboard.
          </p>
        </div>
      </section>

      <p className="dashboard-disclaimer">
        SentinelOps AI · Stored AIOps incident data
      </p>

    </div>
  );
}

export default AIInsights;
