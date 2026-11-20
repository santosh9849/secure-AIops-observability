import { useEffect, useState } from "react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import { getTelemetryHistory } from "../services/api";


function Charts({ sourceId }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    let fetching = false;

    if (!sourceId) {
      setData([]);
      setLoading(false);
      return;
    }

    const fetchHistory = async () => {
      if (fetching) return;

      fetching = true;

      try {
        const records = await getTelemetryHistory(sourceId);

        if (!active) return;

        const chartData = (
          Array.isArray(records) ? records : []
        )
          .map((record) => {
            const timestamp = new Date(
              record.event_time || record.received_at
            ).getTime();

            return {
              time: Number.isFinite(timestamp)
                ? new Date(timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })
                : "Unknown",

              timestamp,
              cpu: Number(record.cpu),
              memory: Number(record.memory),
            };
          })
          .filter(
            (record) =>
              Number.isFinite(record.timestamp) &&
              Number.isFinite(record.cpu) &&
              Number.isFinite(record.memory)
          )
          .sort((a, b) => a.timestamp - b.timestamp);

        setData(chartData);
        setError("");

      } catch (err) {
        if (!active) return;

        console.error(
          "Telemetry history failed:",
          err
        );

        setError("Unable to load telemetry history");

      } finally {
        fetching = false;

        if (active) {
          setLoading(false);
        }
      }
    };

    setLoading(true);

    fetchHistory();

    const interval = window.setInterval(
      fetchHistory,
      1000
    );

    return () => {
      active = false;
      window.clearInterval(interval);
    };

  }, [sourceId]);


  return (
    <section className="chart-panel">

      <div className="panel-heading">

        <div>
          <h3>Resource Performance</h3>

          <p>
            {sourceId
              ? `CPU and memory history · ${sourceId}`
              : "Waiting for a monitored machine"}
          </p>
        </div>

        <span className="chart-period">
          Live history
        </span>

      </div>


      <div className="chart-legend">
        <span>
          <i className="cpu-legend" /> CPU Usage
        </span>

        <span>
          <i className="memory-legend" /> Memory Usage
        </span>
      </div>


      {!sourceId ? (
        <div className="chart-area">
          <p>No monitored source selected.</p>
        </div>

      ) : loading && data.length === 0 ? (
        <div className="chart-area">
          <p>Loading telemetry history...</p>
        </div>

      ) : error ? (
        <div className="chart-area">
          <p>{error}</p>
        </div>

      ) : data.length === 0 ? (
        <div className="chart-area">
          <p>No historical readings received yet.</p>
        </div>

      ) : (
        <div className="chart-area">

          <ResponsiveContainer width="100%" height="100%">

            <AreaChart data={data}>

              <defs>

                <linearGradient
                  id="cpuFill"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="#20c9d8"
                    stopOpacity={0.3}
                  />

                  <stop
                    offset="100%"
                    stopColor="#20c9d8"
                    stopOpacity={0}
                  />
                </linearGradient>

                <linearGradient
                  id="memoryFill"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="#9c83ff"
                    stopOpacity={0.25}
                  />

                  <stop
                    offset="100%"
                    stopColor="#9c83ff"
                    stopOpacity={0}
                  />
                </linearGradient>

              </defs>


              <CartesianGrid
                stroke="#253449"
                strokeDasharray="3 5"
                vertical={false}
              />

              <XAxis
                dataKey="time"
                stroke="#8091a8"
              />

              <YAxis
                stroke="#8091a8"
                unit="%"
                domain={[0, 100]}
              />

              <Tooltip />


              <Area
                type="monotone"
                dataKey="cpu"
                name="CPU Usage"
                stroke="#20c9d8"
                fill="url(#cpuFill)"
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />

              <Area
                type="monotone"
                dataKey="memory"
                name="Memory Usage"
                stroke="#9c83ff"
                fill="url(#memoryFill)"
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />

            </AreaChart>

          </ResponsiveContainer>

        </div>
      )}


      {data.length === 1 && (
        <p className="chart-period">
          One reading received. Additional readings will build the trend.
        </p>
      )}

    </section>
  );
}

export default Charts;