
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'

const data = [
  { time: '10:00', cpu: 32, memory: 45 },
  { time: '10:05', cpu: 40, memory: 48 },
  { time: '10:10', cpu: 35, memory: 51 },
  { time: '10:15', cpu: 55, memory: 53 },
  { time: '10:20', cpu: 48, memory: 58 },
  { time: '10:25', cpu: 62, memory: 55 },
  { time: '10:30', cpu: 52, memory: 61 },
  { time: '10:35', cpu: 45, memory: 59 },
  { time: '10:40', cpu: 58, memory: 64 },
]

function Charts() {
  return (
    <section className="chart-panel">
      <div className="panel-heading">
        <div>
          <h3>Resource Performance</h3>
          <p>CPU and memory utilization over time</p>
        </div>
        <span className="chart-period">Last 40 minutes</span>
      </div>

      <div className="chart-legend">
        <span><i className="cpu-legend" /> CPU Usage</span>
        <span><i className="memory-legend" /> Memory Usage</span>
      </div>

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

            <CartesianGrid stroke="#253449" strokeDasharray="3 5" vertical={false} />
            <XAxis dataKey="time" stroke="#8091a8" />
            <YAxis stroke="#8091a8" unit="%" />
            <Tooltip />

            <Area type="monotone" dataKey="cpu" stroke="#20c9d8" fill="url(#cpuFill)" />
            <Area type="monotone" dataKey="memory" stroke="#9c83ff" fill="url(#memoryFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}

export default Charts
