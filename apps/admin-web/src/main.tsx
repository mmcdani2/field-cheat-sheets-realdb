import React, { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import "./index.css";

const API_BASE = "http://localhost:4000";
const TOKEN_KEY = "field_admin_token";

type LoginResponse = {
  token: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
  };
};

function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}

function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const token = useMemo(() => getStoredToken(), [location.pathname]);

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", color: "#e2e8f0" }}>
      <header style={{ padding: "16px 20px", borderBottom: "1px solid #1e293b" }}>
        <div style={{ fontWeight: 700, fontSize: 18 }}>Field Admin</div>

        <nav style={{ display: "flex", gap: 12, marginTop: 8, alignItems: "center" }}>
          <Link to="/login" style={{ color: "#93c5fd" }}>Login</Link>
          <Link to="/dashboard" style={{ color: "#93c5fd" }}>Dashboard</Link>
          <Link to="/logs" style={{ color: "#93c5fd" }}>Logs</Link>

          {token ? (
            <button
              onClick={() => {
                clearStoredToken();
                navigate("/login");
              }}
              style={{
                marginLeft: "auto",
                background: "#7f1d1d",
                color: "white",
                border: "none",
                padding: "8px 12px",
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              Logout
            </button>
          ) : null}
        </nav>
      </header>

      <main style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>{children}</main>
    </div>
  );
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = getStoredToken();
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("alex@laurelstreetcreative.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const token = getStoredToken();

  useEffect(() => {
    if (token) navigate("/dashboard");
  }, [token, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = (await res.json()) as LoginResponse | { error?: string };

      if (!res.ok) {
        setError("error" in data ? data.error || "Login failed." : "Login failed.");
        return;
      }

      const loginData = data as LoginResponse;
      setStoredToken(loginData.token);
      navigate("/dashboard");
    } catch {
      setError("Could not reach API.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <h1 style={{ marginBottom: 16 }}>Admin Login</h1>

      <form
        onSubmit={handleSubmit}
        style={{
          display: "grid",
          gap: 12,
          maxWidth: 420,
          background: "#111827",
          padding: 20,
          borderRadius: 12,
          border: "1px solid #1f2937",
        }}
      >
        <label style={{ display: "grid", gap: 6 }}>
          <span>Email</span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ padding: 10, borderRadius: 8, border: "1px solid #334155" }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: 10, borderRadius: 8, border: "1px solid #334155" }}
          />
        </label>

        {error ? <div style={{ color: "#fca5a5" }}>{error}</div> : null}

        <button
          type="submit"
          disabled={loading}
          style={{
            background: "#2563eb",
            color: "white",
            border: "none",
            padding: "10px 14px",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          {loading ? "Logging in..." : "Log In"}
        </button>
      </form>
    </Layout>
  );
}

function DashboardPage() {
  const [stats, setStats] = useState<{
    totalLogs: number;
    logsToday: number;
    activeTechs: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        setError("");

        const token = getStoredToken();

        const res = await fetch(`${API_BASE}/api/refrigerant-logs/admin/stats/summary`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data?.error || "Failed to load dashboard stats.");
          return;
        }

        setStats(data);
      } catch {
        setError("Could not reach API.");
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  return (
    <RequireAuth>
      <Layout>
        <h1>Dashboard</h1>

        {loading ? <p>Loading dashboard...</p> : null}
        {error ? <p style={{ color: "#fca5a5" }}>{error}</p> : null}

        {!loading && !error && stats ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 16,
              marginTop: 16,
            }}
          >
            <div
              style={{
                background: "#111827",
                border: "1px solid #1f2937",
                borderRadius: 12,
                padding: 16,
              }}
            >
              <div style={{ fontSize: 14, color: "#94a3b8" }}>Total Logs</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{stats.totalLogs}</div>
            </div>

            <div
              style={{
                background: "#111827",
                border: "1px solid #1f2937",
                borderRadius: 12,
                padding: 16,
              }}
            >
              <div style={{ fontSize: 14, color: "#94a3b8" }}>Logs Today</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{stats.logsToday}</div>
            </div>

            <div
              style={{
                background: "#111827",
                border: "1px solid #1f2937",
                borderRadius: 12,
                padding: 16,
              }}
            >
              <div style={{ fontSize: 14, color: "#94a3b8" }}>Active Techs</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{stats.activeTechs}</div>
            </div>
          </div>
        ) : null}
      </Layout>
    </RequireAuth>
  );
}

function LogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadLogs() {
      try {
        setLoading(true);
        setError("");

        const token = getStoredToken();

        const res = await fetch(`${API_BASE}/api/refrigerant-logs/admin/all`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data?.error || "Failed to load logs.");
          return;
        }

        setLogs(data.logs || []);
      } catch {
        setError("Could not reach API.");
      } finally {
        setLoading(false);
      }
    }

    loadLogs();
  }, []);

  return (
    <RequireAuth>
      <Layout>
        <h1>Logs</h1>

        {loading ? <p>Loading logs...</p> : null}
        {error ? <p style={{ color: "#fca5a5" }}>{error}</p> : null}

        {!loading && !error ? (
          <div style={{ display: "grid", gap: 12 }}>
            {logs.length === 0 ? (
              <p>No logs found.</p>
            ) : (
              logs.map((log) => (
                <Link
                  key={log.id}
                  to={`/logs/${log.id}`}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <div
                    style={{
                      background: "#111827",
                      border: "1px solid #1f2937",
                      borderRadius: 12,
                      padding: 16,
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ fontWeight: 700 }}>
                      {log.customerName || "No customer name"} — {log.refrigerantType}
                    </div>
                    <div style={{ fontSize: 14, color: "#94a3b8", marginTop: 6 }}>
                      Tech: {log.techNameSnapshot}
                    </div>
                    <div style={{ fontSize: 14, color: "#94a3b8" }}>
                      Job: {log.jobNumber || "N/A"} | {log.city || "N/A"}, {log.state || ""}
                    </div>
                    <div style={{ fontSize: 14, color: "#94a3b8" }}>
                      Added: {log.poundsAdded ?? "0"} | Recovered: {log.poundsRecovered ?? "0"}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        ) : null}
      </Layout>
    </RequireAuth>
  );
}

function LogDetailPage() {
  const { id } = useParams();
  const [log, setLog] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadLog() {
      try {
        setLoading(true);
        setError("");

        const token = getStoredToken();

        const res = await fetch(`${API_BASE}/api/refrigerant-logs/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data?.error || "Failed to load log.");
          return;
        }

        setLog(data.log);
      } catch {
        setError("Could not reach API.");
      } finally {
        setLoading(false);
      }
    }

    if (id) loadLog();
  }, [id]);

  return (
    <RequireAuth>
      <Layout>
        <h1>Log Detail</h1>

        {loading ? <p>Loading log...</p> : null}
        {error ? <p style={{ color: "#fca5a5" }}>{error}</p> : null}

        {!loading && !error && log ? (
          <div
            style={{
              background: "#111827",
              border: "1px solid #1f2937",
              borderRadius: 12,
              padding: 16,
              display: "grid",
              gap: 8,
            }}
          >
            <div><strong>ID:</strong> {log.id}</div>
            <div><strong>Customer:</strong> {log.customerName || "N/A"}</div>
            <div><strong>Tech:</strong> {log.techNameSnapshot}</div>
            <div><strong>Company:</strong> {log.companyKey}</div>
            <div><strong>Job Number:</strong> {log.jobNumber || "N/A"}</div>
            <div><strong>Location:</strong> {log.city || "N/A"}, {log.state || ""}</div>
            <div><strong>Equipment:</strong> {log.equipmentType || "N/A"}</div>
            <div><strong>Refrigerant:</strong> {log.refrigerantType}</div>
            <div><strong>Pounds Added:</strong> {log.poundsAdded ?? "0"}</div>
            <div><strong>Pounds Recovered:</strong> {log.poundsRecovered ?? "0"}</div>
            <div><strong>Leak Suspected:</strong> {log.leakSuspected ? "Yes" : "No"}</div>
            <div><strong>Notes:</strong> {log.notes || "N/A"}</div>
            <div><strong>Submitted:</strong> {log.submittedAt}</div>
          </div>
        ) : null}
      </Layout>
    </RequireAuth>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/logs" element={<LogsPage />} />
        <Route path="/logs/:id" element={<LogDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);