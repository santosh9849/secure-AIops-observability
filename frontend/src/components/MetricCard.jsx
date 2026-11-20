
function MetricCard({ title, value, unit, change, icon: Icon, color, description }) {
  return (
    <div className="metric-card">
      <div className="metric-card-top">
        <div className={`metric-icon ${color}`}>
          <Icon size={20} />
        </div>
        <span className="metric-description">{description}</span>
      </div>

      <p className="metric-title">{title}</p>

      <div className="metric-value">
        {value}<span>{unit}</span>
      </div>

      <div className="metric-change">{change}</div>
    </div>
  )
}

export default MetricCard
