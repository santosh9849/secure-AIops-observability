import { Search, Bell, Menu } from "lucide-react";
import { useLocation } from "react-router-dom";

const pageNames = {
  "/dashboard": "Dashboard",
  "/infrastructure": "Infrastructure",
  "/network": "Network Monitoring",
  "/security": "Security Monitoring",
  "/incidents": "Incidents & Alerts",
  "/ai-insights": "AI Insights",
  "/audit-logs": "Audit Logs",
  "/settings": "Settings",
};

function Navbar() {
  const location = useLocation();

  const pageTitle =
    pageNames[location.pathname] || "SentinelOps AI";

  return (
    <header className="navbar">
      <div className="navbar-left">
        <span
          className="mobile-menu-button"
          aria-hidden="true"
        >
          <Menu size={21} />
        </span>

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
          Local Monitoring
        </div>

        <span
          className="navbar-icon-button"
          aria-hidden="true"
        >
          <Search size={19} />
        </span>

        <span
          className="navbar-icon-button"
          aria-hidden="true"
        >
          <Bell size={19} />
        </span>

        <div className="navbar-avatar">SX</div>
      </div>
    </header>
  );
}

export default Navbar;