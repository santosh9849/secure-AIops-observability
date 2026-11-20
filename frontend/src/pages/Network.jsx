
import { useEffect, useState } from "react";

import {
  Wifi,
  Activity,
  ArrowDownToLine,
  ArrowUpFromLine,
  Radio,
  AlertTriangle,
} from "lucide-react";

import {
  getLatestTelemetry,
  getTelemetryHistory,
} from "../services/api";

function getMetric(events, name) {
  const event = (events || []).find(
    item => item.metric_name === name
  );

  if (!event) return null;

  const value = Number(event.metric_value);
  return Number.isFinite(value) ? value : null;
}

function Network() {
  const [record, setRecord] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    let fetching = false;

    const load = async () => {
      if (fetching) return;
      fetching = true;

      try {
        const records = await getLatestTelemetry();

        if (!active) return;

        const list = Array.isArray(records) ? records : [];

        const selected =
          list.find(r => r.source_id === "LOCAL-WINDOWS-01") ||
          list[0] ||
          null;

        setRecord(selected);

        if (selected) {
          const previous = await getTelemetryHistory(
            selected.source_id
          );

          if (!active) return;

          setHistory(
            Array.isArray(previous)
              ? [...previous].reverse()
              : []
          );
        } else {
          setHistory([]);
        }

        setError("");

      } catch (err) {
        console.error("Network data error:", err);
        if (active) setError("Unable to retrieve network telemetry.");
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

  const events = record?.events || [];

  const upload = getMetric(events, "bandwidth_upload_mbps");
  const download = getMetric(events, "bandwidth_download_mbps");
  const packetLoss = getMetric(events, "packet_loss");

  const probe = getMetric(events, "network_probe_available");

  const latencyAvailable =
    record &&
    probe !== 0 &&
    Number.isFinite(Number(record.network_latency)) &&
    Number(record.network_latency) > 0;

  const networkEvents = [
    {
      name: "Download bandwidth",
      value: download,
      unit: "Mbps",
    },
    {
      name: "Upload bandwidth",
      value: upload,
      unit: "Mbps",
    },
    {
      name: "Packet loss",
      value: packetLoss,
      unit: "%",
    },
  ].filter(item => item.value !== null);

  return (
    <div className="network-page">

      <div className="page-intro">
        <div>
          <span className="section-eyebrow">
            NETWORK OBSERVABILITY
          </span>

          <h2>Network Monitoring</h2>
          <p>Real network measurements from monitored machines.</p>
        </div>

        <span className="sample-label">
          {loading ? "LOADING" : error ? "UNAVAILABLE" : record ? "LIVE DATA" : "NO DATA"}
        </span>
      </div>

      <div className="network-metrics">

        <div className="network-metric-card">
          <Activity />
          <span>Network Latency</span>

          <strong>
            {latencyAvailable
              ? Number(record.network_latency).toFixed(1)
              : "—"}
            <small>{latencyAvailable ? "ms" : "Unavailable"}</small>
          </strong>

          <p>Latest network probe</p>
        </div>

        <div className="network-metric-card">
          <ArrowDownToLine />
          <span>Download Speed</span>

          <strong>
            {download !== null ? download.toFixed(3) : "—"}
            <small>{download !== null ? "Mbps" : "Unavailable"}</small>
          </strong>

          <p>Measured interface download rate</p>
        </div>

        <div className="network-metric-card">
          <ArrowUpFromLine />
          <span>Upload Speed</span>

          <strong>
            {upload !== null ? upload.toFixed(3) : "—"}
            <small>{upload !== null ? "Mbps" : "Unavailable"}</small>
          </strong>

          <p>Measured interface upload rate</p>
        </div>

        <div className="network-metric-card">
          <Radio />
          <span>Packet Loss</span>

          <strong>
            {packetLoss !== null ? packetLoss.toFixed(1) : "—"}
            <small>{packetLoss !== null ? "%" : "Unavailable"}</small>
          </strong>

          <p>External probe measurement</p>
        </div>
      </div>

      <section className="network-panel">
        <div className="panel-heading">
          <div>
            <h3>Network Latency Trend</h3>
            <p>Recorded latency readings from the selected machine.</p>
          </div>

          <span className="network-live-label">
            {history.length} readings
          </span>
        </div>

        {history.length === 0 ? (
          <p>No network history available yet.</p>
        ) : (
          <div className="latency-chart">
            {history.slice(-12).map((item, index) => (
              <div className="latency-column" key={`${item.event_time}-${index}`}>
                <strong>
                  {Number(item.network_latency) > 0
                    ? `${Number(item.network_latency).toFixed(0)} ms`
                    : "N/A"}
                </strong>

                <div className="latency-track">
                  <div
                    className="latency-bar"
                    style={{
                      height: `${
                        Number(item.network_latency) > 0
                          ? Math.min(Number(item.network_latency), 150) * 1.5
                          : 0
                      }px`,
                    }}
                  />
                </div>

                <span>
                  {new Date(item.event_time).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="network-panel">
        <div className="panel-heading">
          <div>
            <h3>Network Connectivity</h3>
            <p>Current monitored source and probe availability.</p>
          </div>
        </div>

        <div className="connectivity-row">
          <div>
            <Wifi size={22} />
            <div>
              <strong>{record?.source_id || "No source connected"}</strong>
              <span>{record?.collector_id || "Collector unavailable"}</span>
            </div>
          </div>

          <span className="connection-status">
            {record ? "Reporting" : "Unavailable"}
          </span>
        </div>

        <div className="connectivity-row">
          <div>
            <Activity size={22} />
            <div>
              <strong>External network probe</strong>
              <span>1.1.1.1</span>
            </div>
          </div>

          <span className="connection-status">
            {probe === 1 ? "Available" : "Unavailable"}
          </span>
        </div>
      </section>

      <section className="network-panel">
        <div className="panel-heading">
          <div>
            <h3>Recent Network Measurements</h3>
            <p>Additional network metadata from the collector.</p>
          </div>
        </div>

        {networkEvents.length === 0 ? (
          <p>No network event measurements received yet.</p>
        ) : (
          networkEvents.map(event => (
            <div className="network-event" key={event.name}>
              <AlertTriangle size={19} />

              <div>
                <strong>{event.name}</strong>
                <span>{event.value.toFixed(3)} {event.unit}</span>
              </div>

              <span className="event-status">
                Observed
              </span>
            </div>
          ))
        )}
      </section>

      {error && <p>{error}</p>}

      <p className="dashboard-disclaimer">
        SentinelOps AI · Network data from collector telemetry
      </p>
    </div>
  );
}

export default Network;
