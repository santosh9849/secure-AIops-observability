import { useEffect, useState } from "react";
import {
  Server,
  Cpu,
  MemoryStick,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

import { getLatestTelemetry } from "../services/api";

function UsageBar({ value }) {
  if (!Number.isFinite(value)) {
    return <div className="usage-bar" />;
  }

  const color =
    value >= 85 ? "danger" :
    value >= 70 ? "warning" : "normal";

  return (
    <div className="usage-bar">
      <div
        className={`usage-fill ${color}`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

function getMachineStatus(record) {
  const timestamp = new Date(
    record.received_at || record.event_time
  ).getTime();

  const age = Date.now() - timestamp;

  // Each machine must have reported within the last 60 seconds.
  if (!Number.isFinite(timestamp) || age < 0 || age > 60000) {
    return "Stale";
  }

  const health = String(record.health_status || "").toLowerCase();

  if (["poor", "critical"].includes(health)) return "Critical";
  if (health === "fair") return "Warning";
  if (["good", "excellent"].includes(health)) return "Healthy";

  return "Unknown";
}

function Infrastructure() {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    let fetching = false;

    const load = async () => {
      if (fetching) return;
      fetching = true;

      try {
        const data = await getLatestTelemetry();

        if (!active) return;

        const records = Array.isArray(data) ? data : [];

        setServers(
          records.map((record) => ({
            id: record.source_id,
            collectorId: record.collector_id,
            cpu: Number(record.cpu),
            memory: Number(record.memory),
            disk: Number(record.disk),
            status: getMachineStatus(record),
            lastSeen: record.received_at || record.event_time,
          }))
        );

        setError("");
      } catch (err) {
        console.error("Infrastructure loading failed:", err);
        if (active) setError("Unable to retrieve infrastructure data.");
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

  const reporting = servers.filter(
    (server) => server.status !== "Stale" && server.status !== "Unknown"
  ).length;

  const stale = servers.filter(
    (server) => server.status === "Stale"
  ).length;

  const critical = servers.filter(
    (server) => server.status === "Critical"
  ).length;

  const healthy = servers.filter(
    (server) => server.status === "Healthy"
  ).length;

  return (
    <div className="infrastructure-page">
      <div className="page-intro">
        <div>
          <span className="section-eyebrow">
            INFRASTRUCTURE MONITORING
          </span>
          <h2>Infrastructure Overview</h2>
          <p>
            Actual resource utilization across monitored machines.
          </p>
        </div>

        <span className="sample-label">
          {loading ? "LOADING" : error ? "UNAVAILABLE" : "LIVE DATA"}
        </span>
      </div>

      <div className="infra-summary-grid">
        <div className="infra-summary-card">
          <Server />
          <span>Known Machines</span>
          <strong>{servers.length}</strong>
        </div>

        <div className="infra-summary-card">
          <CheckCircle2 />
          <span>Healthy</span>
          <strong>{healthy}</strong>
        </div>

        <div className="infra-summary-card">
          <AlertTriangle />
          <span>Critical</span>
          <strong>{critical}</strong>
        </div>

        <div className="infra-summary-card">
          <Server />
          <span>Stale</span>
          <strong>{stale}</strong>
        </div>
      </div>

      <section className="infra-server-panel">
        <div className="panel-heading">
          <div>
            <h3>Monitored Machines</h3>
            <p>
              Reporting: {reporting} · Historical or stale sources: {stale}
            </p>
          </div>
        </div>

        {loading && servers.length === 0 ? (
          <p>Loading infrastructure data...</p>
        ) : error ? (
          <p>{error}</p>
        ) : servers.length === 0 ? (
          <p>No machines have reported telemetry yet.</p>
        ) : (
          servers.map((server) => (
            <article className="server-card" key={server.id}>
              <div className="server-heading">
                <div>
                  <Server size={20} />
                  <div>
                    <h4>{server.id}</h4>
                    <span>{server.collectorId}</span>
                  </div>
                </div>

                <span
                  className={`server-status ${server.status.toLowerCase()}`}
                >
                  {server.status}
                </span>
              </div>

              <div className="server-resources">
                <div>
                  <span><Cpu size={15} /> CPU</span>
                  <strong>
                    {Number.isFinite(server.cpu)
                      ? `${server.cpu.toFixed(1)}%`
                      : "—"}
                  </strong>
                  <UsageBar value={server.cpu} />
                </div>

                <div>
                  <span><MemoryStick size={15} /> Memory</span>
                  <strong>
                    {Number.isFinite(server.memory)
                      ? `${server.memory.toFixed(1)}%`
                      : "—"}
                  </strong>
                  <UsageBar value={server.memory} />
                </div>

                <div>
                  <span><HardDrive size={15} /> Disk</span>
                  <strong>
                    {Number.isFinite(server.disk)
                      ? `${server.disk.toFixed(1)}%`
                      : "—"}
                  </strong>
                  <UsageBar value={server.disk} />
                </div>
              </div>

              <small>
                Last telemetry:{" "}
                {Number.isFinite(new Date(server.lastSeen).getTime())
                  ? new Date(server.lastSeen).toLocaleString()
                  : "Unavailable"}
              </small>
            </article>
          ))
        )}
      </section>

      <p className="dashboard-disclaimer">
        SentinelOps AI · Machine status based on individual telemetry timestamps
      </p>
    </div>
  );
}

export default Infrastructure;