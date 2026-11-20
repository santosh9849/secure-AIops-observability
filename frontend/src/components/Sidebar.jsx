import { NavLink } from 'react-router-dom'
import {
  Activity,
  LayoutDashboard,
  Server,
  Network,
  ShieldCheck,
  AlertTriangle,
  BrainCircuit,
  ClipboardList,
  FileCheck2,
  Settings,
  LogOut,
  Radio,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Infrastructure', path: '/infrastructure', icon: Server },
  { name: 'Network', path: '/network', icon: Network },
  { name: 'Security', path: '/security', icon: ShieldCheck },
  { name: 'Incidents', path: '/incidents', icon: AlertTriangle },
  { name: 'AI Insights', path: '/ai-insights', icon: BrainCircuit },
  { name: 'Audit Logs', path: '/audit-logs', icon: ClipboardList },
  { name: 'Egress Proof', path: '/egress-proof', icon: FileCheck2 },
]

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-logo">
          <Activity size={24} />
        </div>

        <div className="brand-text">
          <h2>SentinelOps <span>AI</span></h2>
          <p>INTELLIGENT OBSERVABILITY</p>
        </div>
      </div>

      <div className="sidebar-section-label">WORKSPACE</div>

      <nav className="sidebar-navigation">
        {navigation.map((item) => {
          const Icon = item.icon

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              <Icon size={19} />
              <span>{item.name}</span>
            </NavLink>
          )
        })}
      </nav>

      <div className="sidebar-bottom">
        <div className="collector-status-card">
          <div className="collector-status-heading">
            <Radio size={17} />
            <span>Collector Status</span>
          </div>

          <div className="collector-status-value">
            <span className="status-indicator"></span>
            Monitoring active
          </div>

          <p>Local agent connection status</p>
        </div>

        <NavLink to="/settings" className="sidebar-link">
          <Settings size={19} />
          <span>Settings</span>
        </NavLink>

        <button
          className="sidebar-logout"
          onClick={() => {
            localStorage.removeItem('token')
            window.location.href = '/login'
          }}
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar