import { useEffect, useState } from "react";

import {
  Settings as SettingsIcon,
  Server,
  Radio,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Database,
  BrainCircuit,
} from "lucide-react";

import {
  getHealth,
  getCollectors,
} from "../services/api";


function Settings() {
  const [backendStatus, setBackendStatus] =
    useState("Checking...");

  const [collectors, setCollectors] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    let fetching = false;

    const load = async () => {
      if (fetching) return;

      fetching = true;

      try {
        const [healthResult, collectorResult] =
          await Promise.allSettled([
            getHealth(),
            getCollectors(),
          ]);

        if (!active) return;

        if (healthResult.status === "fulfilled") {
          setBackendStatus(
            healthResult.value?.status === "ok"
              ? "Connected"
              : "Unexpected response"
          );
        } else {
          setBackendStatus("Unavailable");
        }

        if (collectorResult.status === "fulfilled") {
          setCollectors(
            Array.isArray(collectorResult.value)
              ? collectorResult.value
              : []
          );

          setError("");
        } else {
          setError("Unable to retrieve collector information.");
        }

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


  const reportingCollectors = collectors.filter((collector) => {
    const lastSeen = new Date(
      collector.last_seen
    ).getTime();

    const age = Date.now() - lastSeen;

    return (
      Number.isFinite(lastSeen) &&
      age >= 0 &&
      age <= 60000
    );
  });


  return (
    <div className="audit-page">

      {/* Heading */}
      <div className="page-intro">
        <div>
          <span className="section-eyebrow">
            PLATFORM CONFIGURATION
          </span>

          <h2>Settings</h2>

          <p>
            Local deployment information and connected
            service status.
          </p>
        </div>

        <span className="sample-label">
          LOCAL ENVIRONMENT
        </span>
      </div>


      {/* Services */}
      <section className="network-panel">

        <div className="panel-heading">
          <div>
            <h3>
              <Activity size={19} /> Service Connections
            </h3>

            <p>Local SENTINEL X service information.</p>
          </div>
        </div>


        <div className="connectivity-row">
          <div>
            <Server size={22} />

            <div>
              <strong>FastAPI Backend</strong>
              <span>127.0.0.1:8000</span>
            </div>
          </div>

          <span className="connection-status">
            {backendStatus}
          </span>
        </div>


        <div className="connectivity-row">
          <div>
            <BrainCircuit size={22} />

            <div>
              <strong>AIOps Engine</strong>
              <span>127.0.0.1:8001</span>
            </div>
          </div>

          <span className="connection-status">
            Integrated with backend
          </span>
        </div>


        <div className="connectivity-row">
          <div>
            <Activity size={22} />

            <div>
              <strong>React Frontend</strong>
              <span>localhost:5173</span>
            </div>
          </div>

          <span className="connection-status">
            Running
          </span>
        </div>


        <div className="connectivity-row">
          <div>
            <Database size={22} />

            <div>
              <strong>SQLite Database</strong>
              <span>Local telemetry and incident storage</span>
            </div>
          </div>

          <span className="connection-status">
            Backend managed
          </span>
        </div>

      </section>


      {/* Collector details */}
      <section className="network-panel">

        <div className="panel-heading">
          <div>
            <h3>
              <Radio size={19} /> Registered Collectors
            </h3>

            <p>
              Collector registration and reporting information.
            </p>
          </div>
        </div>


        {loading ? (
          <p>Loading collector information...</p>
        ) : collectors.length === 0 ? (
          <p>No registered collectors found.</p>
        ) : (
          collectors.map((collector) => {

            const lastSeen = new Date(
              collector.last_seen
            );

            const age = Date.now() - lastSeen.getTime();

            const online =
              Number.isFinite(lastSeen.getTime()) &&
              age >= 0 &&
              age <= 60000;

            return (
              <div
                className="connectivity-row"
                key={collector.collector_id}
              >
                <div>
                  <Radio size={22} />

                  <div>
                    <strong>{collector.collector_id}</strong>

                    <span>
                      Last seen:{" "}
                      {Number.isFinite(lastSeen.getTime())
                        ? lastSeen.toLocaleString()
                        : "Unavailable"}
                    </span>
                  </div>
                </div>

                <span className="connection-status">
                  {online ? "Reporting" : "Stale"}
                </span>
              </div>
            );
          })
        )}

        {error && <p>{error}</p>}

      </section>


      {/* Platform information */}
      <section className="security-notice">
        <SettingsIcon size={22} />

        <div>
          <strong>Configuration information</strong>

          <p>
            Collector interval, API endpoint, collector
            credentials and pseudonymization settings are
            configured through local environment variables.
            This page currently provides read-only
            configuration information.
          </p>
        </div>
      </section>


      {/* Security information */}
      <section className="security-notice">
        <AlertTriangle size={22} />

        <div>
          <strong>Authentication status</strong>

          <p>
            Collector API-key authentication is implemented.
            Dashboard-user authentication and role-based
            access control are not yet configured.
          </p>
        </div>
      </section>


      <p className="dashboard-disclaimer">
        SentinelOps AI · Local deployment settings
      </p>

    </div>
  );
}

export default Settings;