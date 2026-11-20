import { useEffect, useState } from "react";

import {
  Cpu,
  MemoryStick,
  HardDrive,
  Wifi,
  CheckCircle2,
  Radio,
  BrainCircuit,
} from "lucide-react";

import MetricCard from "../components/MetricCard";
import Charts from "../components/Charts";
import AlertCard from "../components/AlertCard";

import {
  getLatestTelemetry,
  getCollectors,
  getIncidents,
} from "../services/api";


const metricDefinitions = [
  {
    title: "CPU Usage",
    key: "cpu",
    unit: "%",
    icon: Cpu,
    color: "cyan",
    description: "Processor utilization",
  },
  {
    title: "Memory Usage",
    key: "memory",
    unit: "%",
    icon: MemoryStick,
    color: "purple",
    description: "RAM consumption",
  },
  {
    title: "Disk Usage",
    key: "disk",
    unit: "%",
    icon: HardDrive,
    color: "green",
    description: "Storage utilization",
  },
  {
    title: "Network Latency",
    key: "network_latency",
    unit: "ms",
    icon: Wifi,
    color: "orange",
    description: "Network response time",
  },
];


function formatTime(value) {
  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return "Time unavailable";
  }

  const seconds = Math.max(
    0,
    Math.floor((Date.now() - date.getTime()) / 1000)
  );

  if (seconds < 60) return `${seconds}s ago`;

  if (seconds < 3600) {
    return `${Math.floor(seconds / 60)} min ago`;
  }

  if (seconds < 86400) {
    return `${Math.floor(seconds / 3600)} hr ago`;
  }

  return `${Math.floor(seconds / 86400)} days ago`;
}


function Dashboard() {
  const [telemetry, setTelemetry] = useState(null);
  const [latestRecords, setLatestRecords] = useState([]);
  const [collectors, setCollectors] = useState([]);
  const [incidents, setIncidents] = useState([]);

  const [connectionStatus, setConnectionStatus] =
    useState("Connecting...");

  const [collectorError, setCollectorError] = useState("");
  const [incidentError, setIncidentError] = useState("");

  useEffect(() => {
    let active = true;
    let fetching = false;

    const fetchDashboardData = async () => {
      if (fetching) return;

      fetching = true;

      try {
        const results = await Promise.allSettled([
          getLatestTelemetry(),
          getCollectors(),
          getIncidents(),
        ]);

        if (!active) return;

        // Latest telemetry
        if (results[0].status === "fulfilled") {
          const result = results[0].value;

          const records = Array.isArray(result)
            ? result
            : result
              ? [result]
              : [];

          const sortedRecords = [...records].sort((a, b) => {
            const timeA = new Date(
              a.received_at || a.event_time
            ).getTime() || 0;

            const timeB = new Date(
              b.received_at || b.event_time
            ).getTime() || 0;

            return timeB - timeA;
          });

          setLatestRecords(sortedRecords);

          const localMachine = sortedRecords.find(
            (record) =>
              record.source_id === "LOCAL-WINDOWS-01"
          );

          setTelemetry(
            localMachine || sortedRecords[0] || null
          );

          setConnectionStatus(
            sortedRecords.length > 0
              ? "Connected to live telemetry"
              : "Connected - waiting for telemetry"
          );
        } else {
          setConnectionStatus("Telemetry unavailable");
          console.error(results[0].reason);
        }

        // Collector information
        if (results[1].status === "fulfilled") {
          setCollectors(
            Array.isArray(results[1].value)
              ? results[1].value
              : []
          );

          setCollectorError("");
        } else {
          setCollectorError(
            "Unable to retrieve collector status"
          );

          console.error(results[1].reason);
        }

        // Incidents
        if (results[2].status === "fulfilled") {
          setIncidents(
            Array.isArray(results[2].value)
              ? results[2].value
              : []
          );

          setIncidentError("");
        } else {
          setIncidentError(
            "Unable to retrieve incidents"
          );

          console.error(results[2].reason);
        }

      } finally {
        fetching = false;
      }
    };

    fetchDashboardData();

    const interval = window.setInterval(
      fetchDashboardData,
      1000
    );

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);


  // Actual telemetry values
  const metrics = metricDefinitions.map((definition) => ({
    ...definition,
    value: telemetry
      ? Number(telemetry[definition.key]).toFixed(1)
      : "—",
  }));


  // Collector reporting status
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

  const totalCollectors = collectors.length;
  const onlineCount = reportingCollectors.length;

  const collectorPercentage =
    totalCollectors > 0
      ? (onlineCount / totalCollectors) * 100
      : 0;


  // Actual monitored sources
  const monitoredSources = new Set(
    latestRecords.map((record) => record.source_id)
  ).size;


  // Actual open incidents
  const openIncidents = incidents.filter((incident) =>
    ["open", "acknowledged"].includes(
      String(incident.status).toLowerCase()
    )
  ).length;


  // Actual incident information
  const alerts = incidents.map((incident) => ({
    title: incident.title,
    source: incident.source_id,

    time: formatTime(
      incident.last_seen ||
      incident.created_at ||
      incident.first_seen
    ),

    priority: String(
      incident.severity || "UNKNOWN"
    ),

    status: String(
      incident.status || "unknown"
    ),
  }));


  const latestInsight = incidents.find(
    (incident) =>
      incident.recommendation ||
      incident.probable_cause ||
      incident.description
  );


  return (
    <div className="dashboard">

      {/* Dashboard heading */}
      <section className="dashboard-welcome">
        <div>
          <span className="section-eyebrow">
            <span className="live-indicator" />
            SYSTEM MONITORING
          </span>

          <h2>Dashboard Overview</h2>

          <p>
            Live infrastructure monitoring from connected machines.
          </p>
        </div>

        <span className="sample-label">
          {telemetry ? "LIVE DATA" : "WAITING FOR DATA"}
        </span>
      </section>


      {/* Overall health */}
      <section className="system-health">

        <div className="health-icon">
          <CheckCircle2 size={26} />
        </div>

        <div className="health-information">
          <span>OVERALL SYSTEM HEALTH</span>

          <h3>
            {telemetry?.health_status || "Awaiting telemetry"}
          </h3>

          <p>{connectionStatus}</p>
        </div>

        <div className="health-stat">
          <strong>{monitoredSources}</strong>
          <span>Monitored Sources</span>
        </div>

        <div className="health-stat">
          <strong>{openIncidents}</strong>
          <span>Open Incidents</span>
        </div>

        <div className="health-stat">
          <strong>{onlineCount}</strong>
          <span>Reporting Collectors</span>
        </div>

      </section>


      {/* Infrastructure metrics */}
      <section className="dashboard-section">

        <div className="section-heading">
          <div>
            <h3>Infrastructure Metrics</h3>

            <p>
              Actual resource utilization across monitored systems
            </p>
          </div>
        </div>

        <div className="metrics-grid">
          {metrics.map((metric) => (
            <MetricCard
              key={metric.title}
              {...metric}
            />
          ))}
        </div>

      </section>


      {/* Charts and collectors */}
      <section className="dashboard-grid">

        <Charts sourceId={telemetry?.source_id} />

        <div className="collector-panel">

          <div className="panel-heading">
            <div>
              <h3>Collector Status</h3>
              <p>Local telemetry agents</p>
            </div>

            <Radio size={20} />
          </div>

          <div className="collector-counts">

            <div>
              <strong>
                {String(totalCollectors).padStart(2, "0")}
              </strong>

              <span>Total Collectors</span>
            </div>

            <div>
              <strong>
                {String(onlineCount).padStart(2, "0")}
              </strong>

              <span>Reporting</span>
            </div>

          </div>

          <div className="collector-progress">
            <div
              style={{
                width: `${collectorPercentage}%`,
              }}
            />
          </div>

          {collectorError ? (
            <p>{collectorError}</p>
          ) : collectors.length === 0 ? (
            <p>No registered collectors.</p>
          ) : (
            collectors.map((collector) => {
              const age =
                Date.now() -
                new Date(collector.last_seen).getTime();

              const isOnline =
                Number.isFinite(age) &&
                age >= 0 &&
                age <= 60000;

              return (
                <div
                  className="collector-item"
                  key={collector.collector_id}
                >
                  <span>{collector.collector_id}</span>

                  <span
                    className={
                      isOnline
                        ? "online-text"
                        : "offline-text"
                    }
                  >
                    {isOnline ? "Reporting" : "Stale"}
                  </span>
                </div>
              );
            })
          )}

        </div>

      </section>


      {/* Recent incidents */}
      <section className="alerts-panel">

        <div className="panel-heading">
          <div>
            <h3>Recent Incidents</h3>

            <p>
              Incidents recorded by the backend and AIOps engine
            </p>
          </div>
        </div>

        <div className="alert-list">

          {incidentError ? (
            <p>{incidentError}</p>
          ) : alerts.length === 0 ? (
            <p>No incidents have been recorded.</p>
          ) : (
            alerts.map((alert, index) => (
              <AlertCard
                key={
                  incidents[index].incident_id || index
                }
                {...alert}
              />
            ))
          )}

        </div>

      </section>


      {/* AI Insights */}
      <section className="ai-insight-panel">

        <BrainCircuit size={24} />

        <div>
          <span>AI OPS INSIGHT</span>

          {latestInsight ? (
            <>
              <h3>{latestInsight.title}</h3>

              <p>
                {latestInsight.probable_cause ||
                  latestInsight.description ||
                  "Anomaly detected by the AIOps engine."}
              </p>

              {latestInsight.recommendation && (
                <p>
                  Recommendation:{" "}
                  {latestInsight.recommendation}
                </p>
              )}
            </>
          ) : (
            <>
              <h3>No active AIOps insight</h3>

              <p>
                No incident with an available recommendation
                has been recorded.
              </p>
            </>
          )}
        </div>

      </section>


      <p className="dashboard-disclaimer">
        SentinelOps AI · Live data from FastAPI backend
      </p>

    </div>
  );
}

export default Dashboard;