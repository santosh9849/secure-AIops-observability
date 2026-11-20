
import { AlertTriangle, Clock3 } from 'lucide-react'

function AlertCard({ title, source, time, priority, status }) {
  return (
    <div className="alert-row">
      <div className="alert-information">
        <AlertTriangle size={18} />
        <div>
          <strong>{title}</strong>
          <span>{source}</span>
        </div>
      </div>

      <span className="alert-time">
        <Clock3 size={13} /> {time}
      </span>

      <span className={`priority ${priority.toLowerCase()}`}>
        {priority}
      </span>

      <span className="alert-status">{status}</span>
    </div>
  )
}

export default AlertCard
