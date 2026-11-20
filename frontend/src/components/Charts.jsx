
import { useEffect, useState } from 'react'

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'

import { getTelemetryHistory } from '../services/api'

function Charts() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    const fetchHistory = async () => {
      try {
        const records = await getTelemetryHistory('server-001')

        if (!active) return

        const chartData = (Array.isArray(records) ? records : [])
          .map((record) => ({
            time: new Date(record.event_time).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
            timestamp: new Date(record.event_time).getTime(),
            cpu: Number(record.cpu),
            memory: Number(record.memory),
          }))
          .filter(
            (record) =>
              Number.isFinite(record.timestamp) &&
              Number.isFinite(record.cpu) &&
              Number.isFinite(record.memory)
          )
          .sort((a, b) => a.timestamp - b.timestamp)

        setData(chartData)
        setError('')
      } catch (err) {
        if (!active) return

        console.error('Chart history fetch failed:', err)
        setError('Unable to load telemetry history')
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchHistory()

    const interval = setInterval(fetchHistory, 10000)

    return () => {
      active = false
      clearInterval(interval)
    }
  }, [])

  return (
    <section className="chart-panel">
      <div className="panel-heading">
        <div>
          <h3>Resource Performance</h3>
          <p>CPU and memory utilization over time</p>
        </div>
        <span className="chart-period">Live history</span>
      </div>

      <div className="chart-legend">
        <span><i className="cpu-legend" /> CPU Usage</span>
        <span><i className="memory-legend" /> Memory Usage</span>
      </div>

      {loading ? (
        <div className="chart-area">
          <p>Loading telemetry history...</p>
        </div>
      ) : error ? (
        <div className="chart-area">
          <p>{error}</p>
        </div>
      ) : data.length === 0 ? (
        <div className="chart-area">
          <p>No historical telemetry available yet.</p>
        </div>
      ) : (
        <>
          <div className="chart-area">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="cpuFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#20c9d8" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#20c9d8" stopOpacity={0} />
                  </linearGradient>

                  <linearGradient id="memoryFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#9c83ff" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#9c83ff" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  stroke="#253449"
                  strokeDasharray="3 5"
                  vertical={false}
                />

                <XAxis dataKey="time" stroke="#8091a8" />
                <YAxis stroke="#8091a8" unit="%" domain={[0, 100]} />
                <Tooltip />

                <Area
                  type="monotone"
                  dataKey="cpu"
                  name="CPU Usage"
                  stroke="#20c9d8"
                  fill="url(#cpuFill)"
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />

                <Area
                  type="monotone"
                  dataKey="memory"
                  name="Memory Usage"
                  stroke="#9c83ff"
                  fill="url(#memoryFill)"
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {data.length === 1 && (
            <p className="chart-period">
              One reading received. More telemetry readings will build the trend.
            </p>
          )}
        </>
      )}
    </section>
  )
}

export default Charts
