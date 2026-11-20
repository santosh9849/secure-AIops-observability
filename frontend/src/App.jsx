import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Infrastructure from "./pages/Infrastructure";
import Network from "./pages/Network";
import Security from "./pages/Security";
import Incidents from "./pages/Incidents";
import AIInsights from "./pages/AIInsights";
import AuditLogs from "./pages/AuditLogs";
import Settings from "./pages/Settings";

import "./App.css";


function Layout() {
  return (
    <div className="app-layout">

      <Sidebar />

      <main className="main-area">

        <Navbar />

        <div className="page-content">

          <Routes>
            <Route
              path="/dashboard"
              element={<Dashboard />}
            />

            <Route
              path="/infrastructure"
              element={<Infrastructure />}
            />

            <Route
              path="/network"
              element={<Network />}
            />

            <Route
              path="/security"
              element={<Security />}
            />

            <Route
              path="/incidents"
              element={<Incidents />}
            />

            <Route
              path="/ai-insights"
              element={<AIInsights />}
            />

            <Route
              path="/audit-logs"
              element={<AuditLogs />}
            />

            <Route
              path="/settings"
              element={<Settings />}
            />

            <Route
              path="*"
              element={<Navigate to="/dashboard" replace />}
            />

          </Routes>

        </div>
      </main>
    </div>
  );
}


function App() {
  return (
    <BrowserRouter>

      <Routes>

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/"
          element={<Navigate to="/dashboard" replace />}
        />

        <Route
          path="/*"
          element={<Layout />}
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;