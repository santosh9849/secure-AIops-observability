import { useNavigate } from "react-router-dom";

import {
  Activity,
  ShieldCheck,
  LockKeyhole,
  ArrowRight,
  Server,
} from "lucide-react";


function Login() {
  const navigate = useNavigate();

  return (
    <div className="login-page">

      <div className="login-brand">

        <div className="login-logo">
          <Activity size={32} />
        </div>

        <h1>
          SentinelOps <span>AI</span>
        </h1>

        <p>INTELLIGENT OBSERVABILITY</p>

      </div>


      <div className="login-card">

        <div className="login-icon">
          <ShieldCheck size={28} />
        </div>

        <h2>Welcome</h2>

        <p className="login-subtitle">
          Access your local infrastructure monitoring workspace.
        </p>


        <div className="security-notice">
          <Server size={21} />

          <div>
            <strong>Local evaluation environment</strong>

            <p>
              SENTINEL X is running locally with a Windows
              telemetry collector, backend database and
              integrated AIOps engine.
            </p>
          </div>
        </div>


        <button
          type="button"
          className="login-submit"
          onClick={() => navigate("/dashboard")}
        >
          Continue to Dashboard
          <ArrowRight size={18} />
        </button>


        <div className="login-security">
          <LockKeyhole size={14} />

          Collector API-key authentication is enabled.
        </div>


        <p className="login-message">
          Note: This is a local demo entry screen.
          Dashboard-user authentication is not configured.
        </p>

      </div>


      <p className="login-footer">
        © 2026 SentinelOps AI · Intelligent Observability Platform
      </p>

    </div>
  );
}

export default Login;