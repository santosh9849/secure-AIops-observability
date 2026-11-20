
import { Search, Bell, Menu } from 'lucide-react'
import { useLocation } from 'react-router-dom'

const pageNames = {
  '/dashboard': 'Dashboard',
  '/infrastructure': 'Infrastructure',
  '/network': 'Network Monitoring',
  '/security': 'Security Monitoring',
  '/incidents': 'Incidents & Alerts',
  '/ai-insights': 'AI Insights',
  '/audit-logs': 'Audit Logs',
  '/settings': 'Settings',
}

function Navbar() {
  const location = useLocation()
  const pageTitle = pageNames[location.pathname] || 'SentinelOps AI'

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button className="mobile-menu-button" aria-label="Open menu">
          <Menu size={21} />
        </button>

        <div>
          <p className="navbar-breadcrumb">
            Workspace / <span>{pageTitle}</span>
          </p>
          <h1>{pageTitle}</h1>
        </div>
      </div>

      <div className="navbar-right">
        <div className="environment-badge">
          <span className="status-indicator"></span>
          Demo Environment
        </div>

        <button className="navbar-icon-button" aria-label="Search">
          <Search size={19} />
        </button>

        <button className="navbar-icon-button notification-button" aria-label="Notifications">
          <Bell size={19} />
          <span className="notification-dot"></span>
        </button>

        <div className="navbar-avatar">SO</div>
      </div>
    </header>
  )
}

export default Navbar
